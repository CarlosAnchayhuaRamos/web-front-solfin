const { CreditReversalsService } = require('../../src/credits/credit-reversals.service');
const { CreditsController } = require('../../src/credits/credits.controller');

const input = { kind: 'CANCEL_CREDIT', requestId: '14fd1686-8b5d-421f-a023-9755daee7ec4', reason: 'Registro incorrecto', cashSessionId: '14fd1686-8b5d-421f-a023-9755daee7ec5' };
const terms = { method: 'SIMPLE', rate: 0, capRate: 0, fixedDailyAmount: 0, graceDays: 0 };
function setup() {
  const credit = { id: 'credit', code: 'CRE-00001', organizationId: 'org', clientId: 'client', client: { firstName: 'A', lastName: 'B', dni: '12345678' },
    status: 'ACTIVE', disbursedAt: new Date(), principalAmount: 1000, penaltyTerms: terms,
    schedules: [{ id: 'schedule', installmentNo: 1, paidAmount: 0, penaltyPaid: 0, penalty: 0, penaltyAccruedDays: 0, totalDue: 137.5, status: 'PENDING', dueDate: new Date('2099-01-01Z') }] };
  const tx = {
    $queryRaw: jest.fn(), credit: { findFirst: jest.fn().mockResolvedValue(credit), update: jest.fn() },
    payment: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    paymentReceipt: { findUnique: jest.fn() },
    paymentSchedule: { updateMany: jest.fn(), update: jest.fn() },
    auditLog: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
    cashSession: { findFirst: jest.fn().mockResolvedValue({ id: input.cashSessionId, openingAmount: 1000, cashBox: { name: 'Caja 1' } }), findUnique: jest.fn().mockResolvedValue({ status: 'OPEN' }) },
    cashMovement: { create: jest.fn(), groupBy: jest.fn().mockResolvedValue([]) }, creditStatusHistory: { create: jest.fn() },
  };
  const db = { appUser: { findFirst: jest.fn().mockResolvedValue({ id: 'admin', role: 'ADMIN', organizationId: 'org', fullName: 'Admin' }) }, $transaction: (fn) => fn(tx) };
  return { service: new CreditReversalsService(db), tx, credit, db };
}
test('cancellation returns principal to cash and preserves a voucher and canceled schedules', async () => {
  const { service, tx } = setup();
  const result = await service.reverse('credit', input, 'admin');
  expect(result.voucher).toMatchObject({ amount: 1000, cashDirection: 'IN', remainingBalance: 0 });
  expect(tx.cashMovement.create).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 1000, direction: 'IN' }) });
  expect(tx.credit.update).toHaveBeenCalledWith({ where: { id: 'credit' }, data: expect.objectContaining({ status: 'CANCELED' }) });
  expect(tx.paymentSchedule.updateMany).toHaveBeenCalledWith({ where: { creditId: 'credit' }, data: { status: 'CANCELED' } });
  expect(tx.auditLog.create).toHaveBeenCalled();
});
test('retries return stored result even after cancellation without another movement', async () => {
  const { service, tx, credit } = setup();
  credit.status = 'CANCELED';
  tx.auditLog.findUnique.mockResolvedValue({ entityId: 'credit', actorId: 'admin', action: input.kind, after: { input, voucher: { amount: 1000 } } });
  expect((await service.reverse('credit', input, 'admin')).voucher.amount).toBe(1000);
  expect(tx.cashMovement.create).not.toHaveBeenCalled();
});
test('cancellation refuses collected payments and a closed cash session', async () => {
  const { service, tx } = setup();
  tx.payment.findMany.mockResolvedValueOnce([{ id: 'payment' }]);
  await expect(service.reverse('credit', input, 'admin')).rejects.toThrow('Revierta primero');
  tx.cashSession.findUnique.mockResolvedValue({ status: 'CLOSED' });
  await expect(service.reverse('credit', input, 'admin')).rejects.toThrow('cerrada');
  expect(tx.cashMovement.create).not.toHaveBeenCalled();
});
test('an approved credit is canceled without inventing cash income', async () => {
  const { service, credit, tx } = setup();
  credit.status = 'APPROVED'; credit.disbursedAt = null;
  expect((await service.reverse('credit', input, 'admin')).voucher.amount).toBe(0);
  expect(tx.cashMovement.create).not.toHaveBeenCalled();
});
test('the whole latest receipt is reversed across all covered installments', async () => {
  const { service, credit, tx } = setup();
  const earlier = { ...credit.schedules[0], id: 'earlier', installmentNo: 1, paidAmount: 137.5, status: 'PAID' };
  credit.schedules[0] = { ...credit.schedules[0], installmentNo: 2, paidAmount: 137.5, status: 'PAID' };
  credit.schedules.push(earlier); credit.status = 'PAID';
  const allocations = [
    { id: 'latest', creditId: 'credit', paymentScheduleId: 'schedule', amount: 137.5, baseAmount: 137.5, penaltyAmount: 0, receiptId: 'receipt' },
    { id: 'earlier-payment', creditId: 'credit', paymentScheduleId: 'earlier', amount: 137.5, baseAmount: 137.5, penaltyAmount: 0, receiptId: 'receipt' },
  ];
  tx.payment.findMany.mockResolvedValue(allocations);
  tx.paymentReceipt.findUnique.mockResolvedValue({ id: 'receipt', creditId: 'credit', amount: 275, payments: allocations });
  const request = { ...input, kind: 'REVERSE_PAYMENT', latestPaymentId: 'latest' };
  const result = await service.reverse('credit', request, 'admin');
  expect(result.voucher).toMatchObject({ amount: 275, remainingBalance: 275, cashDirection: 'OUT', originalVoucherCode: 'VCH-receipt', details: [
    { installmentNo: 1, amount: 137.5, baseAmount: 137.5, penaltyAmount: 0 },
    { installmentNo: 2, amount: 137.5, baseAmount: 137.5, penaltyAmount: 0 },
  ] });
  expect(tx.payment.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['latest', 'earlier-payment'] }, reversedAt: null }, data: { reversedAt: expect.any(Date) } });
  expect(tx.cashMovement.create).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 275, direction: 'OUT' }) });
  expect(tx.credit.update).toHaveBeenCalledWith({ where: { id: 'credit' }, data: expect.objectContaining({ status: 'ACTIVE', closedAt: null }) });
  await expect(service.reverse('credit', { ...request, latestPaymentId: 'stale' }, 'admin')).rejects.toThrow('cambio');
  tx.cashMovement.groupBy.mockResolvedValue([{ direction: 'OUT', _sum: { amount: 1000 } }]);
  await expect(service.reverse('credit', request, 'admin')).rejects.toThrow('insuficiente');
});

test('reversing a receipt preserves older abonos and only subtracts its penalty allocation', async () => {
  const { service, credit, tx } = setup();
  Object.assign(credit.schedules[0], { paidAmount: 100, penaltyPaid: 10, penalty: 10, status: 'PARTIAL' });
  const latest = { id: 'latest', creditId: 'credit', paymentScheduleId: 'schedule', receiptId: 'receipt', amount: 40, baseAmount: 35, penaltyAmount: 5 };
  tx.payment.findMany.mockResolvedValue([latest, { ...latest, id: 'older', receiptId: 'older-receipt', amount: 60 }]);
  tx.paymentReceipt.findUnique.mockResolvedValue({ id: 'receipt', creditId: 'credit', amount: 40, payments: [latest] });
  const request = { ...input, kind: 'REVERSE_PAYMENT', latestPaymentId: 'latest' };
  const result = await service.reverse('credit', request, 'admin');
  expect(result.voucher).toMatchObject({ amount: 40, remainingBalance: 87.5 });
  expect(tx.paymentSchedule.update).toHaveBeenCalledWith({ where: { id: 'schedule' }, data: expect.objectContaining({ paidAmount: 60, penaltyPaid: 5, status: 'PARTIAL' }) });
  const audit = tx.auditLog.create.mock.calls[0][0].data;
  tx.auditLog.findUnique.mockResolvedValue(audit);
  tx.cashMovement.create.mockClear();
  expect((await service.reverse('credit', request, 'admin')).voucher).toEqual(result.voucher);
  expect(tx.cashMovement.create).not.toHaveBeenCalled();
});

test('a partially reversed historical receipt is rejected before issuing another refund', async () => {
  const { service, tx } = setup();
  tx.payment.findMany.mockResolvedValue([{ id: 'latest', receiptId: 'receipt' }]);
  tx.paymentReceipt.findUnique.mockResolvedValue({ id: 'receipt', creditId: 'credit', payments: [{ reversedAt: new Date() }] });
  await expect(service.reverse('credit', { ...input, kind: 'REVERSE_PAYMENT', latestPaymentId: 'latest' }, 'admin')).rejects.toThrow('conciliacion');
  expect(tx.cashMovement.create).not.toHaveBeenCalled();
});
test('only an active administrator may reverse, and endpoint enforces ADMIN role', async () => {
  const { service, db } = setup();
  db.appUser.findFirst.mockResolvedValue(null);
  await expect(service.reverse('credit', input, 'cashier')).rejects.toThrow('administrador');
  expect(Reflect.getMetadata('roles', CreditsController.prototype.reverse)).toEqual(['ADMIN']);
});
