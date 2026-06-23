import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreditStatus, CreditType, DocumentType, InterestCalculationMethod, PaymentFrequency, PaymentMethod, PaymentStatus, StorageProvider, UserRole } from '@prisma/client';
import { normalizePenaltySettings } from '../parameters/parameters.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AssignCreditAdvisorInput, CreateCreditInput, CreditSimulationInput, CreditSimulationResult, DisburseCreditInput, PayInstallmentsInput } from './credits.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

const productSeed = {
  EXPRESS: {
    approvalLimit: 3500,
    defaultInstallments: 6,
    defaultInterestRate: 0.12,
    maxAmount: 3000,
    minAmount: 300,
    name: 'Credito Express',
    requiresGuarantee: false,
    type: CreditType.EXPRESS,
  },
  GARANTIA: {
    approvalLimit: 8000,
    defaultInstallments: 12,
    defaultInterestRate: 0.1,
    maxAmount: 10000,
    minAmount: 1000,
    name: 'Credito con Garantia',
    requiresGuarantee: true,
    type: CreditType.GARANTIA,
  },
} as const;

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async simulate(input: CreditSimulationInput): Promise<CreditSimulationResult> {
    input.interestCalculationMethod = input.interestCalculationMethod ?? InterestCalculationMethod.CONTINUOUS;
    input.paymentFrequency = input.paymentFrequency ?? PaymentFrequency.MONTHLY;
    this.validateSimulationInput(input);

    const organization = await this.getOrganization();
    const product = await this.getProduct(organization.id, input.productType);
    const policy = await this.getCreditPolicy(organization.id);
    const client = input.clientId
      ? await this.prisma.client.findFirst({
          where: { id: input.clientId, organizationId: organization.id },
        })
      : null;

    if (input.amount < Number(product.minAmount)) {
      throw new BadRequestException(`El monto minimo para ${product.name} es ${product.minAmount}`);
    }

    if (input.installments > policy.maxInstallments) {
      throw new BadRequestException(`El maximo de cuotas permitido es ${policy.maxInstallments}`);
    }

    const monthlyInterestRate = this.getCreditInterestRate(input, policy, client);
    const installments = input.interestCalculationMethod === InterestCalculationMethod.EQUAL_INSTALLMENTS
      ? this.getEqualInstallmentSchedule(input.amount, input.installments, input.paymentFrequency, monthlyInterestRate)
      : this.getContinuousInterestSchedule(input.amount, input.installments, input.paymentFrequency, monthlyInterestRate);
    const totalAmount = this.roundMoney(installments.reduce((total, installment) => total + installment.totalDue, 0));
    const installmentAmount = this.roundMoney(totalAmount / input.installments);

    return {
      amount: input.amount,
      interestCalculationMethod: input.interestCalculationMethod,
      installmentAmount,
      installments,
      interestRate: monthlyInterestRate,
      paymentFrequency: input.paymentFrequency,
      totalAmount: this.roundMoney(totalAmount),
    };
  }

  async create(input: CreateCreditInput, requesterId: string) {
    const simulation = await this.simulate(input);
    const organization = await this.getOrganization();
    const product = await this.getProduct(organization.id, input.productType);
    const policy = await this.getCreditPolicy(organization.id);
    const requester = await this.prisma.appUser.findFirst({
      where: {
        id: requesterId,
        isActive: true,
        organizationId: organization.id,
        role: { in: [UserRole.ADMIN, UserRole.ANALYST] },
      },
    });
    const client = await this.prisma.client.findFirst({
      where: {
        id: input.clientId,
        organizationId: organization.id,
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (!requester) {
      throw new NotFoundException('Usuario solicitante no encontrado');
    }

    const code = await this.nextCreditCode(organization.id);
    const fileNames = this.getRequestFileNames(input.fileNames);

    if (fileNames.length > (policy.maxRequestFiles ?? 5)) {
      throw new BadRequestException(`Maximo ${policy.maxRequestFiles ?? 5} archivos permitidos`);
    }

    const requiresAdminApproval = requester.role !== UserRole.ADMIN && input.amount > Number(requester.creditLimit);

    const credit = await this.prisma.credit.create({
      data: {
        analystId: requester.id,
        approvedById: requiresAdminApproval ? undefined : requester.id,
        clientId: client.id,
        code,
        firstDueDate: new Date(`${simulation.installments[0].dueDate}T00:00:00.000Z`),
        installmentAmount: simulation.installmentAmount,
        installmentCount: input.installments,
        interestCalculationMethod: input.interestCalculationMethod,
        interestRate: simulation.interestRate,
        organizationId: organization.id,
        paymentFrequency: input.paymentFrequency,
        principalAmount: input.amount,
        productId: product.id,
        schedules: {
          create: simulation.installments.map((installment) => ({
            dueDate: new Date(`${installment.dueDate}T00:00:00.000Z`),
            installmentNo: installment.installmentNo,
            interest: installment.interest,
            principal: installment.principal,
            totalDue: installment.totalDue,
          })),
        },
        documents: {
          create: fileNames.map((fileName) => ({
            fileName,
            mimeType: 'application/octet-stream',
            organizationId: organization.id,
            provider: StorageProvider.LOCAL,
            sizeBytes: 0,
            storageKey: `credit-requests/${code}/${fileName}`,
            type: DocumentType.OTHER,
            uploadedById: requester.id,
          })),
        },
        approvalRequest: requiresAdminApproval
          ? {
              create: {
                analystLimit: requester.creditLimit,
                organizationId: organization.id,
                reason: input.notes?.trim() || 'Credito registrado para revision',
                requestedAmount: input.amount,
                requestedById: requester.id,
              },
            }
          : undefined,
        status: requiresAdminApproval ? CreditStatus.PENDING_APPROVAL : CreditStatus.APPROVED,
        totalAmount: simulation.totalAmount,
        type: input.productType,
      },
      include: {
        approvalRequest: true,
        client: true,
        documents: true,
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
    });

    if (requiresAdminApproval) return { ...credit, contract: null };
    const penaltySettings = normalizePenaltySettings(policy.penaltySettings, Number(policy.defaultPenaltyRate), policy.graceDays);
    const penaltySetting = penaltySettings[input.paymentFrequency];

    return {
      ...credit,
      contract: {
        advisorName: requester.fullName,
        approvedAt: new Date().toISOString(),
        approvedByName: requester.fullName,
        clientAddress: [client.personalAddress, client.district, client.province, client.department].filter(Boolean).join(', ') || null,
        clientDni: client.dni,
        clientName: `${client.firstName} ${client.lastName}`,
        creditCode: credit.code,
        installmentAmount: Number(credit.installmentAmount),
        installmentCount: credit.installmentCount,
        interestCalculationMethod: credit.interestCalculationMethod,
        interestRate: Number(credit.interestRate),
        paymentFrequency: credit.paymentFrequency,
        penaltyRate: penaltySetting.rate,
        principalAmount: Number(credit.principalAmount),
        schedules: credit.schedules.map((schedule) => ({
          dueDate: schedule.dueDate.toISOString(),
          installmentNo: schedule.installmentNo,
          interest: Number(schedule.interest),
          principal: Number(schedule.principal),
          totalDue: Number(schedule.totalDue),
        })),
        totalAmount: Number(credit.totalAmount),
      },
    };
  }

  async findApprovedByClient(clientId: string) {
    const organization = await this.getOrganization();
    const policy = await this.getCreditPolicy(organization.id);
    const penaltySettings = normalizePenaltySettings(policy.penaltySettings, Number(policy.defaultPenaltyRate), policy.graceDays);

    const credits = await this.prisma.credit.findMany({
      include: {
        analyst: true,
        approvalRequest: true,
        approvedBy: true,
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      where: {
        clientId,
        organizationId: organization.id,
        status: { in: [CreditStatus.APPROVED, CreditStatus.ACTIVE, CreditStatus.OVERDUE] },
      },
    });

    return credits.map((credit) => {
      const netValue = Number(credit.totalAmount) - Number(credit.principalAmount);
      const overdueAmount = credit.schedules.reduce((total, schedule) => {
        return total + this.calculatePenalty(schedule, credit.paymentFrequency, penaltySettings);
      }, 0);
      const penaltySetting = penaltySettings[credit.paymentFrequency];

      return {
        advisorId: credit.analyst.id,
        advisorName: credit.analyst.fullName,
        approvedAt: (credit.approvalRequest?.reviewedAt ?? credit.createdAt).toISOString(),
        approvedByName: credit.approvedBy?.fullName ?? null,
        code: credit.code,
        id: credit.id,
        installmentAmount: Number(credit.installmentAmount),
        interestCalculationMethod: credit.interestCalculationMethod,
        interestRate: Number(credit.interestRate),
        netValue,
        overdueAmount,
        paymentFrequency: credit.paymentFrequency,
        penaltyRate: penaltySetting.rate,
        principalAmount: Number(credit.principalAmount),
        schedules: credit.schedules.map((schedule) => ({
          dueDate: schedule.dueDate.toISOString().slice(0, 10),
          id: schedule.id,
          installmentNo: schedule.installmentNo,
          interest: Number(schedule.interest),
          paidAmount: Number(schedule.paidAmount),
          penalty: this.calculatePenalty(schedule, credit.paymentFrequency, penaltySettings),
          principal: Number(schedule.principal),
          status: this.getScheduleStatus(schedule),
          totalDue: Number(schedule.totalDue),
        })),
        status: credit.status,
        totalAmount: Number(credit.totalAmount),
        type: credit.type,
      };
    });
  }

  async findAdvisors() {
    const organization = await this.getOrganization();
    return this.prisma.appUser.findMany({
      orderBy: { fullName: 'asc' },
      select: { fullName: true, id: true, role: true },
      where: {
        isActive: true,
        organizationId: organization.id,
        role: { in: [UserRole.ADMIN, UserRole.ANALYST] },
      },
    });
  }

  async assignAdvisor(creditId: string, input: AssignCreditAdvisorInput) {
    if (!input.advisorId?.trim()) {
      throw new BadRequestException('El asesor es obligatorio');
    }

    const organization = await this.getOrganization();
    const advisor = await this.prisma.appUser.findFirst({
      where: {
        id: input.advisorId,
        isActive: true,
        organizationId: organization.id,
        role: { in: [UserRole.ADMIN, UserRole.ANALYST] },
      },
    });

    if (!advisor) {
      throw new NotFoundException('Asesor no encontrado');
    }

    const credit = await this.prisma.credit.findFirst({
      where: { id: creditId, organizationId: organization.id },
    });

    if (!credit) {
      throw new NotFoundException('Credito no encontrado');
    }

    await this.prisma.credit.update({
      data: { analystId: advisor.id },
      where: { id: credit.id },
    });

    return { advisorId: advisor.id, advisorName: advisor.fullName };
  }

  async payInstallments(creditId: string, input: PayInstallmentsInput) {
    const paymentAmount = this.roundMoney(input.amount);

    if (!Number.isFinite(input.amount) || paymentAmount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    if (!input.userId?.trim()) {
      throw new BadRequestException('El cajero es obligatorio');
    }

    const organization = await this.getOrganization();
    const credit = await this.prisma.credit.findFirst({
      include: { client: true },
      where: { id: creditId, organizationId: organization.id },
    });

    if (!credit) {
      throw new NotFoundException('Credito no encontrado');
    }

    if (credit.status !== CreditStatus.ACTIVE && credit.status !== CreditStatus.OVERDUE) {
      throw new BadRequestException('El credito debe estar desembolsado para registrar pagos');
    }

    const schedules = await this.prisma.paymentSchedule.findMany({
      orderBy: { installmentNo: 'asc' },
      where: {
        creditId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
      },
    });

    if (!schedules.length) {
      throw new BadRequestException('No hay cuotas pendientes');
    }

    const policy = await this.getCreditPolicy(organization.id);
    const penaltySettings = normalizePenaltySettings(policy.penaltySettings, Number(policy.defaultPenaltyRate), policy.graceDays);
    const cashSession = await this.findOpenCashSession(organization.id, input.userId);

    if (!cashSession) {
      throw new BadRequestException('Debe tener una caja abierta para registrar pagos');
    }

    const totalPending = this.roundMoney(
      schedules.reduce((total, schedule) => {
        const penalty = this.calculatePenalty(schedule, credit.paymentFrequency, penaltySettings);
        return total + Number(schedule.totalDue) + penalty - Number(schedule.paidAmount);
      }, 0),
    );

    if (paymentAmount > totalPending) {
      throw new BadRequestException(`El monto supera la deuda pendiente de S/ ${totalPending.toFixed(2)}`);
    }

    const appliedSchedules: number[] = [];
    let remainingAmount = paymentAmount;

    await this.prisma.$transaction(async (tx) => {
      for (const schedule of schedules) {
        if (remainingAmount <= 0) break;

        const schedulePenalty = this.calculatePenalty(schedule, credit.paymentFrequency, penaltySettings);
        const schedulePending = this.roundMoney(Number(schedule.totalDue) + schedulePenalty - Number(schedule.paidAmount));
        const appliedAmount = this.roundMoney(Math.min(remainingAmount, schedulePending));
        const newPaidAmount = this.roundMoney(Number(schedule.paidAmount) + appliedAmount);
        const isPaid = newPaidAmount >= Number(schedule.totalDue) + schedulePenalty;
        const payment = await tx.payment.create({
          data: {
            amount: appliedAmount,
            creditId,
            method: PaymentMethod.CASH,
            paymentScheduleId: schedule.id,
          },
        });

        await tx.paymentSchedule.update({
          data: {
            paidAmount: newPaidAmount,
            paidAt: isPaid ? new Date() : null,
            penalty: schedulePenalty,
            status: isPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
          },
          where: { id: schedule.id },
        });

        await tx.cashMovement.create({
          data: {
            amount: appliedAmount,
            cashSessionId: cashSession.id,
            creditId,
            description: `Pago cuota ${schedule.installmentNo} credito ${credit.code}`,
            direction: 'IN',
            paymentId: payment.id,
            reference: payment.id,
            type: 'PAYMENT_COLLECTION',
            userId: input.userId,
          },
        });

        appliedSchedules.push(schedule.installmentNo);
        remainingAmount = this.roundMoney(remainingAmount - appliedAmount);
      }
    });

    const credits = await this.findApprovedByClient(credit.clientId);

    return {
      credits,
      voucher: {
        amount: paymentAmount,
        cashierName: cashSession.user.fullName,
        clientDni: credit.client.dni,
        clientName: `${credit.client.firstName} ${credit.client.lastName}`,
        creditCode: credit.code,
        paidAt: new Date().toISOString(),
        remainingBalance: this.roundMoney(totalPending - paymentAmount),
        scheduleNumbers: appliedSchedules,
        voucherCode: `VCH-${Date.now()}`,
      },
    };
  }

  async disburse(creditId: string, input: DisburseCreditInput) {
    if (!input.userId?.trim()) {
      throw new BadRequestException('El responsable del desembolso es obligatorio');
    }

    const organization = await this.getOrganization();
    const responsible = await this.prisma.appUser.findFirst({
      where: {
        id: input.userId,
        isActive: true,
        organizationId: organization.id,
        role: { in: [UserRole.ADMIN, UserRole.CASHIER] },
      },
    });

    if (!responsible) {
      throw new BadRequestException('No autorizado para desembolsar creditos');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findFirst({
        where: { id: creditId, organizationId: organization.id },
      });

      if (!credit) {
        throw new NotFoundException('Credito no encontrado');
      }

      if (credit.status !== CreditStatus.APPROVED || credit.disbursedAt) {
        throw new BadRequestException('El credito no esta disponible para desembolso');
      }

      const cashSession = await tx.cashSession.findFirst({
        include: { cashBox: true },
        orderBy: { openedAt: 'desc' },
        where: {
          cashBox: { organizationId: organization.id },
          status: 'OPEN',
          userId: responsible.id,
        },
      });

      if (!cashSession) {
        throw new BadRequestException('Debe tener una caja abierta para desembolsar');
      }

      const available = await tx.$queryRawUnsafe<Array<{ availableAmount: unknown }>>(
        `
          SELECT cs."openingAmount" + COALESCE(SUM(
            CASE WHEN cm.direction = 'IN'::"CashMovementDirection" THEN cm.amount ELSE -cm.amount END
          ), 0) AS "availableAmount"
          FROM cash_sessions cs
          LEFT JOIN cash_movements cm ON cm."cashSessionId" = cs.id
          WHERE cs.id = $1::uuid
            AND cs.status = 'OPEN'::"CashSessionStatus"
          GROUP BY cs.id
        `,
        cashSession.id,
      );
      const availableAmount = Number(available[0]?.availableAmount ?? 0);
      const disbursementAmount = Number(credit.principalAmount);

      if (availableAmount < disbursementAmount) {
        throw new BadRequestException(`Efectivo insuficiente en caja. Disponible S/ ${availableAmount.toFixed(2)}`);
      }

      await tx.cashMovement.create({
        data: {
          amount: disbursementAmount,
          cashSessionId: cashSession.id,
          creditId: credit.id,
          description: `Desembolso credito ${credit.code}`,
          direction: 'OUT',
          reference: credit.code,
          type: 'CREDIT_DISBURSEMENT',
          userId: responsible.id,
        },
      });
      await tx.credit.update({
        data: { disbursedAt: new Date(), status: CreditStatus.ACTIVE },
        where: { id: credit.id },
      });
      await tx.creditStatusHistory.create({
        data: {
          changedById: responsible.id,
          creditId: credit.id,
          fromStatus: CreditStatus.APPROVED,
          notes: `Desembolsado desde caja ${cashSession.cashBox.name}`,
          toStatus: CreditStatus.ACTIVE,
        },
      });

      return {
        clientId: credit.clientId,
        disbursement: {
          amount: disbursementAmount,
          cashBox: cashSession.cashBox.name,
          cashSessionId: cashSession.id,
          creditCode: credit.code,
          disbursedAt: new Date().toISOString(),
        },
      };
    }, { isolationLevel: 'Serializable' });

    return {
      credits: await this.findApprovedByClient(result.clientId),
      disbursement: result.disbursement,
    };
  }

  private async findOpenCashSession(organizationId: string, userId: string) {
    const sessions = await this.prisma.cashSession.findMany({
      include: { user: true },
      orderBy: { openedAt: 'desc' },
      take: 1,
      where: {
        cashBox: { organizationId },
        status: 'OPEN',
        userId,
      },
    });

    return sessions[0] ?? null;
  }


  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private async getProduct(organizationId: string, type: CreditType) {
    const seed = productSeed[type];

    return this.prisma.creditProduct.upsert({
      create: {
        approvalLimit: seed.approvalLimit,
        defaultInstallments: seed.defaultInstallments,
        defaultInterestRate: seed.defaultInterestRate,
        isActive: true,
        maxAmount: seed.maxAmount,
        minAmount: seed.minAmount,
        name: seed.name,
        organizationId,
        requiresGuarantee: seed.requiresGuarantee,
        type: seed.type,
      },
      update: {
        approvalLimit: seed.approvalLimit,
        defaultInstallments: seed.defaultInstallments,
        defaultInterestRate: seed.defaultInterestRate,
        isActive: true,
        maxAmount: seed.maxAmount,
        minAmount: seed.minAmount,
        name: seed.name,
        requiresGuarantee: seed.requiresGuarantee,
      },
      where: {
        organizationId_type: {
          organizationId,
          type,
        },
      },
    });
  }

  private async getCreditPolicy(organizationId: string) {
    return this.prisma.creditPolicy.upsert({
      create: {
        defaultInterestRate: 0.12,
        defaultPenaltyRate: 0.005,
        graceDays: 2,
        maxAnalystApprovalAmount: 3500,
        maxInstallments: 12,
        maxRequestFiles: 5,
        organizationId,
        penaltySettings: normalizePenaltySettings(null, 0.005, 2),
        requireApprovalAboveLimit: true,
        specialInterestRate: 0.1,
      } as never,
      update: {},
      where: { organizationId },
    });
  }

  private async nextCreditCode(organizationId: string) {
    const count = await this.prisma.credit.count({ where: { organizationId } });
    return `CRE-${String(count + 1).padStart(5, '0')}`;
  }

  private validateSimulationInput(input: CreditSimulationInput) {
    if (!input.productType) {
      throw new BadRequestException('El producto es obligatorio');
    }

    if (!input.amount || input.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    if (!Number.isFinite(input.amount)) {
      throw new BadRequestException('El monto debe ser un numero valido');
    }

    if (!input.installments || input.installments <= 0) {
      throw new BadRequestException('Las cuotas deben ser mayores a cero');
    }

    if (!Number.isInteger(input.installments)) {
      throw new BadRequestException('Las cuotas deben ser un numero entero');
    }

    if (!Object.values(PaymentFrequency).includes(input.paymentFrequency)) {
      throw new BadRequestException('La frecuencia de pago no es valida');
    }

    if (!Object.values(InterestCalculationMethod).includes(input.interestCalculationMethod)) {
      throw new BadRequestException('El tipo de interes no es valido');
    }

    if (input.interestRate != null && input.interestRate < 0) {
      throw new BadRequestException('La tasa de interes no puede ser negativa');
    }
  }

  private getCreditInterestRate(
    input: CreditSimulationInput,
    policy: { defaultInterestRate: unknown; specialInterestRate?: unknown },
    client: { isSpecial: boolean; specialInterestRate: unknown | null } | null,
  ) {
    if (input.interestRate != null && Number.isFinite(input.interestRate)) return input.interestRate;
    if (client?.isSpecial && client.specialInterestRate != null) return Number(client.specialInterestRate);
    if (client?.isSpecial) return Number(policy.specialInterestRate ?? policy.defaultInterestRate);
    return Number(policy.defaultInterestRate);
  }

  private getContinuousInterestSchedule(amount: number, installments: number, paymentFrequency: PaymentFrequency, monthlyInterestRate: number) {
    const periodFactor = this.getPaymentFrequencyMonthFactor(paymentFrequency);
    const totalMonths = installments * periodFactor;
    const totalAmount = this.roundMoney(amount * Math.exp(monthlyInterestRate * totalMonths));
    const totalInterest = totalAmount - amount;
    const principal = this.roundMoney(amount / installments);
    const interest = this.roundMoney(totalInterest / installments);

    return Array.from({ length: installments }, (_, index) => {
      const installmentNo = index + 1;
      const isLastInstallment = installmentNo === installments;
      const previousPrincipal = principal * (installments - 1);
      const previousInterest = interest * (installments - 1);
      const installmentPrincipal = isLastInstallment ? this.roundMoney(amount - previousPrincipal) : principal;
      const installmentInterest = isLastInstallment ? this.roundMoney(totalInterest - previousInterest) : interest;

      return {
        dueDate: this.getDueDate(paymentFrequency, installmentNo).toISOString().slice(0, 10),
        installmentNo,
        interest: installmentInterest,
        principal: installmentPrincipal,
        totalDue: this.roundMoney(installmentPrincipal + installmentInterest),
      };
    });
  }

  private getEqualInstallmentSchedule(amount: number, installments: number, paymentFrequency: PaymentFrequency, monthlyInterestRate: number) {
    const periodRate = monthlyInterestRate * this.getPaymentFrequencyMonthFactor(paymentFrequency);
    const installmentAmount = periodRate > 0
      ? this.roundMoney(amount * (periodRate / (1 - Math.pow(1 + periodRate, -installments))))
      : this.roundMoney(amount / installments);
    let remainingPrincipal = amount;

    return Array.from({ length: installments }, (_, index) => {
      const installmentNo = index + 1;
      const isLastInstallment = installmentNo === installments;
      const interest = this.roundMoney(remainingPrincipal * periodRate);
      const principal = isLastInstallment ? this.roundMoney(remainingPrincipal) : this.roundMoney(installmentAmount - interest);
      const totalDue = isLastInstallment ? this.roundMoney(principal + interest) : installmentAmount;
      remainingPrincipal = this.roundMoney(remainingPrincipal - principal);

      return {
        dueDate: this.getDueDate(paymentFrequency, installmentNo).toISOString().slice(0, 10),
        installmentNo,
        interest,
        principal,
        totalDue,
      };
    });
  }

  private calculatePenalty(
    schedule: { dueDate: Date; paidAmount: unknown; penalty: unknown; status: PaymentStatus; totalDue: unknown },
    paymentFrequency: PaymentFrequency,
    penaltySettings: ReturnType<typeof normalizePenaltySettings>,
  ) {
    if (schedule.status === PaymentStatus.PAID || schedule.status === PaymentStatus.CANCELED) return Number(schedule.penalty);

    const setting = penaltySettings[paymentFrequency];
    const daysLate = this.getPenaltyDays(schedule.dueDate, setting.graceDays);

    if (daysLate <= 0) return 0;

    const pendingBase = this.roundMoney(Math.max(0, Number(schedule.totalDue) - Number(schedule.paidAmount)));

    if (pendingBase <= 0) return 0;

    if (setting.method === 'FIXED_DAILY') {
      return this.roundMoney(setting.fixedDailyAmount * daysLate);
    }

    const simplePenalty = this.roundMoney(pendingBase * setting.rate * daysLate);

    if (setting.method === 'SIMPLE') return simplePenalty;

    return this.roundMoney(Math.min(simplePenalty, pendingBase * setting.capRate));
  }

  private getScheduleStatus(schedule: { dueDate: Date; status: PaymentStatus }) {
    if (schedule.status === PaymentStatus.PAID || schedule.status === PaymentStatus.CANCELED) return schedule.status;
    if (this.getPenaltyDays(schedule.dueDate, 0) <= 0) return schedule.status;
    return PaymentStatus.OVERDUE;
  }

  private getPenaltyDays(dueDate: Date, graceDays: number) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const daysLate = Math.floor((todayStart.getTime() - dueDateStart.getTime()) / 86_400_000);

    return Math.max(0, daysLate - graceDays);
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private getPaymentFrequencyMonthFactor(paymentFrequency: PaymentFrequency) {
    if (paymentFrequency === PaymentFrequency.DAILY) return 1 / 30;
    if (paymentFrequency === PaymentFrequency.WEEKLY) return 7 / 30;
    return 1;
  }

  private getDueDate(paymentFrequency: PaymentFrequency, installmentNo: number) {
    const dueDate = new Date();

    if (paymentFrequency === PaymentFrequency.DAILY) {
      dueDate.setDate(dueDate.getDate() + installmentNo);
      return dueDate;
    }

    if (paymentFrequency === PaymentFrequency.WEEKLY) {
      dueDate.setDate(dueDate.getDate() + (installmentNo - 1) * 7);
      return dueDate;
    }

    dueDate.setMonth(dueDate.getMonth() + installmentNo - 1);
    return dueDate;
  }

  private getRequestFileNames(fileNames: string[] | undefined) {
    if (!fileNames?.length) return [];

    return fileNames.map((fileName) => fileName.trim()).filter(Boolean);
  }
}
