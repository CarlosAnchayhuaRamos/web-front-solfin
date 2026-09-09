const { CreditsService } = require('../../src/credits/credits.service');

const makeService = () => {
  const schedule = { id: 'schedule', dueDate: new Date('2099-01-01Z'), installmentNo: 1, totalDue: 100, paidAmount: 0, penalty: 0, penaltyPaid: 0, penaltyAccruedDays: 0, status: 'PENDING' };
  const receipts = new Map();
  const calls = [];
  const tx = {
    $queryRaw: jest.fn(async () => { calls.push('lock'); }),
    credit: {
      findFirst: jest.fn(async () => { calls.push('read-credit'); return { id: 'credit', clientId: 'client', code: 'CRE-1', status: 'ACTIVE', paymentFrequency: 'MONTHLY', penaltyTerms: { method: 'SIMPLE', rate: 0.01, graceDays: 0, capRate: 0.1, fixedDailyAmount: 1 }, client: { dni: '12345678', firstName: 'Test', lastName: 'Client' } }; }),
      update: jest.fn(),
    },
    paymentReceipt: { findUnique: jest.fn(async ({ where }) => receipts.get(where.id)), create: jest.fn(async ({ data }) => { receipts.set(data.id, data); }) },
    paymentSchedule: {
      findMany: jest.fn(async () => [{ ...schedule }]),
      update: jest.fn(async ({ data }) => Object.assign(schedule, data)),
      count: jest.fn(async () => schedule.status === 'PAID' ? 0 : 1),
    },
    cashSession: { findFirst: jest.fn(async () => ({ id: 'cash', user: { fullName: 'Cashier' } })), findUnique: jest.fn(async () => ({ status: 'OPEN' })) },
    payment: { create: jest.fn(async () => ({ id: 'payment' })) },
    cashMovement: { create: jest.fn() }, creditStatusHistory: { create: jest.fn() },
  };
  const prisma = { $transaction: jest.fn(async (run) => run(tx)) };
  const service = new CreditsService(prisma);
  service.getOrganization = async () => ({ id: 'org' });
  service.findApprovedByClient = async () => [];
  return { service, tx, calls, schedule };
};
const input = { amount: 50, userId: 'cashier', requestId: '00000000-0000-4000-8000-000000000001' };

test('retrying same receipt returns original voucher without collecting again', async () => {
  const { service, tx, calls, schedule } = makeService();
  const first = await service.payInstallments('credit', input);
  const retry = await service.payInstallments('credit', input);
  expect(retry.voucher).toEqual(first.voucher);
  expect(tx.payment.create).toHaveBeenCalledTimes(1);
  expect(tx.cashMovement.create).toHaveBeenCalledTimes(1);
  expect(schedule.paidAmount).toBe(50);
  expect(calls.slice(0, 2)).toEqual(['lock', 'read-credit']);
});

test('receipt key cannot be reused for different amount', async () => {
  const { service, tx } = makeService();
  await service.payInstallments('credit', input);
  await expect(service.payInstallments('credit', { ...input, amount: 20 })).rejects.toThrow('ya usado');
  expect(tx.payment.create).toHaveBeenCalledTimes(1);
});

test('paying remaining balance closes the credit and records history', async () => {
  const { service, tx } = makeService();
  await service.payInstallments('credit', { ...input, amount: 100 });
  expect(tx.credit.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PAID' }) }));
  expect(tx.creditStatusHistory.create).toHaveBeenCalledTimes(1);
});

test('closed cash session prevents all payment writes', async () => {
  const { service, tx } = makeService();
  tx.cashSession.findUnique.mockResolvedValue({ status: 'CLOSED' });
  await expect(service.payInstallments('credit', input)).rejects.toThrow('cerrada');
  expect(tx.payment.create).not.toHaveBeenCalled();
});
