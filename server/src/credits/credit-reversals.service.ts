import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreditStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { accruedPenalty, limaDate, penaltyDays, readPenaltyTerms } from './credits.lib';
import type { ReverseCreditInput, ReversalVoucher } from './credits.types';

@Injectable()
export class CreditReversalsService {
  constructor(private readonly prisma: PrismaService) {}

  async reverse(creditId: string, input: ReverseCreditInput, userId: string) {
    if (!['CANCEL_CREDIT', 'REVERSE_PAYMENT'].includes(input.kind)) throw new BadRequestException('Operacion invalida');
    if (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 500) throw new BadRequestException('Indique el motivo, hasta 500 caracteres');
    if (typeof input.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) throw new BadRequestException('Identificador de operacion invalido');
    const admin = await this.prisma.appUser.findFirst({ where: { id: userId, isActive: true, role: 'ADMIN' } });
    if (!admin) throw new BadRequestException('Solo el administrador puede revertir operaciones');

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM credits WHERE id = ${creditId}::uuid FOR UPDATE`;
      const credit = await tx.credit.findFirst({ where: { id: creditId, organizationId: admin.organizationId },
        include: { client: true, schedules: { orderBy: { installmentNo: 'desc' } } } });
      if (!credit) throw new NotFoundException('Credito no encontrado');
      const previous = await tx.auditLog.findUnique({ where: { id: input.requestId } });
      if (previous) {
        const saved = previous.after as unknown as { input: ReverseCreditInput; voucher: ReversalVoucher };
        if (previous.entityId !== creditId || previous.actorId !== userId || previous.action !== input.kind
          || saved.input.reason !== input.reason || saved.input.cashSessionId !== input.cashSessionId
          || saved.input.latestPaymentId !== input.latestPaymentId) throw new ConflictException('Identificador usado para otra operacion');
        return { clientId: credit.clientId, voucher: saved.voucher };
      }
      const cancel = input.kind === 'CANCEL_CREDIT';
      const allowed: CreditStatus[] = cancel ? ['APPROVED', 'ACTIVE', 'OVERDUE'] : ['ACTIVE', 'OVERDUE', 'PAID'];
      if (!allowed.includes(credit.status)) throw new BadRequestException('El estado del credito no permite esta operacion');
      const payments = await tx.payment.findMany({ where: { creditId, reversedAt: null }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
      if (cancel && (payments.length || credit.schedules.some((s) => Number(s.paidAmount) > 0))) throw new BadRequestException('Revierta primero las cuotas pagadas antes de anular el credito');
      if (!cancel && (!payments.length || payments[0].id !== input.latestPaymentId)) throw new ConflictException('El ultimo pago cambio. Actualice los creditos');
      if (!cancel && !payments[0].receiptId) throw new BadRequestException('El pago no tiene comprobante; requiere conciliacion');
      const receipt = !cancel ? await tx.paymentReceipt.findUnique({ where: { id: payments[0].receiptId! }, include: { payments: true } }) : null;
      if (!cancel && (!receipt || receipt.creditId !== creditId || receipt.payments.some((p) => p.reversedAt))) throw new BadRequestException('El comprobante requiere conciliacion antes de revertir');
      const applied = receipt ? receipt.payments : [];
      const round = (n: number) => Math.round(n * 100) / 100;
      const amount = cancel ? (credit.disbursedAt ? Number(credit.principalAmount) : 0) : round(applied.reduce((n, p) => n + Number(p.amount), 0));
      if (!cancel && (!applied.length || amount !== Number(receipt!.amount) || applied.some((p) => p.creditId !== creditId || !p.paymentScheduleId || p.baseAmount == null || p.penaltyAmount == null
        || round(Number(p.baseAmount) + Number(p.penaltyAmount)) !== Number(p.amount)
        || !credit.schedules.some((s) => s.id === p.paymentScheduleId)))) throw new BadRequestException('Los pagos requieren conciliacion antes de revertir');
      if (amount > 0 && (typeof input.cashSessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.cashSessionId))) throw new BadRequestException('Seleccione una caja abierta');
      const session = amount > 0 ? await tx.cashSession.findFirst({ where: { id: input.cashSessionId, status: 'OPEN', cashBox: { organizationId: admin.organizationId } }, include: { cashBox: true } }) : null;
      if (amount > 0 && !session) throw new BadRequestException('Seleccione una caja abierta');
      if (session) {
        await tx.$queryRaw`SELECT id FROM cash_sessions WHERE id = ${session.id}::uuid FOR UPDATE`;
        const locked = await tx.cashSession.findUnique({ where: { id: session.id } });
        if (locked?.status !== 'OPEN') throw new ConflictException('La caja ya fue cerrada');
        if (!cancel) {
          const movements = await tx.cashMovement.groupBy({ by: ['direction'], where: { cashSessionId: session.id }, _sum: { amount: true } });
          const available = Number(session.openingAmount) + movements.reduce((n, m) => n + (m.direction === 'IN' ? 1 : -1) * Number(m._sum.amount ?? 0), 0);
          if (round(available) < amount) throw new BadRequestException('Efectivo insuficiente para devolver el pago');
        }
      }
      const now = new Date();
      let status: CreditStatus = CreditStatus.CANCELED;
      let remainingBalance = 0;
      const details: ReversalVoucher['details'] = [];
      if (cancel) {
        await tx.paymentSchedule.updateMany({ where: { creditId }, data: { status: PaymentStatus.CANCELED } });
      }
      if (!cancel) {
        const terms = readPenaltyTerms(credit.penaltyTerms);
        await tx.payment.updateMany({ where: { id: { in: applied.map((p) => p.id) }, reversedAt: null }, data: { reversedAt: now } });
        const updated = [];
        for (const schedule of credit.schedules) {
          const allocations = applied.filter((p) => p.paymentScheduleId === schedule.id);
          if (!allocations.length) { updated.push(schedule); continue; }
          const reverted = round(allocations.reduce((n, p) => n + Number(p.amount), 0));
          const penaltyAmount = round(allocations.reduce((n, p) => n + Number(p.penaltyAmount), 0));
          const paidAmount = round(Number(schedule.paidAmount) - reverted);
          const penaltyPaid = round(Number(schedule.penaltyPaid) - penaltyAmount);
          if (paidAmount < 0 || penaltyPaid < 0 || penaltyPaid > paidAmount) throw new BadRequestException('El saldo de la cuota requiere conciliacion');
          const data = {
            paidAmount, penaltyPaid, paidAt: null, penalty: accruedPenalty(schedule, terms),
            penaltyAccruedDays: Math.max(schedule.penaltyAccruedDays, penaltyDays(schedule.dueDate, terms.graceDays)),
            status: PaymentStatus.PENDING as PaymentStatus,
          };
          if (paidAmount > 0) data.status = PaymentStatus.PARTIAL;
          if (schedule.dueDate < limaDate()) data.status = PaymentStatus.OVERDUE;
          await tx.paymentSchedule.update({ where: { id: schedule.id }, data });
          updated.push({ ...schedule, ...data });
          details.push({ installmentNo: schedule.installmentNo, amount: reverted,
            baseAmount: round(reverted - penaltyAmount), penaltyAmount });
        }
        remainingBalance = round(updated.reduce((n, s) => n + Number(s.totalDue) + accruedPenalty(s, terms) - Number(s.paidAmount), 0));
        status = updated.some((s) => s.status !== PaymentStatus.PAID && s.dueDate < limaDate()) ? CreditStatus.OVERDUE : CreditStatus.ACTIVE;
        details.sort((a, b) => a.installmentNo - b.installmentNo);
      }
      if (session) await tx.cashMovement.create({ data: {
        cashSessionId: session.id, creditId, userId, amount, direction: cancel ? 'IN' : 'OUT',
        type: cancel ? 'CREDIT_DISBURSEMENT' : 'PAYMENT_COLLECTION', reference: `REV-${input.requestId}`,
        description: `${cancel ? 'Anulacion credito' : 'Reversion pago VCH-' + receipt!.id} ${credit.code}: ${input.reason.trim()}`,
      } });
      await tx.credit.update({ where: { id: creditId }, data: { status, closedAt: cancel ? now : null, generatedDocuments: cancel ? {} : undefined } });
      await tx.creditStatusHistory.create({ data: { creditId, changedById: userId, fromStatus: credit.status, toStatus: status, notes: input.reason.trim() } });
      const receiptIds = [...new Set(applied.map((p) => p.receiptId).filter(Boolean))];
      const voucher: ReversalVoucher = {
        voucherCode: `REV-${input.requestId}`, originalVoucherCode: receiptIds.length ? receiptIds.map((id) => `VCH-${id}`).join(', ') : null,
        creditCode: credit.code, clientName: `${credit.client.firstName} ${credit.client.lastName}`, clientDni: credit.client.dni,
        administratorName: admin.fullName, cashBox: session?.cashBox.name ?? null, reversedAt: now.toISOString(),
        reason: input.reason.trim(), amount, cashDirection: session ? (cancel ? 'IN' : 'OUT') : null, remainingBalance, details,
      };
      await tx.auditLog.create({ data: { id: input.requestId, organizationId: admin.organizationId, actorId: userId,
        entity: 'Credit', entityId: creditId, action: input.kind, before: { status: credit.status, paymentIds: applied.map((p) => p.id) },
        after: { input: { ...input }, voucher: { ...voucher } } } });
      return { clientId: credit.clientId, voucher };
    }, { timeout: 20000 });
  }
}
