const { CreditsService } = require('../../src/credits/credits.service');

const setup = () => {
  const credit = { id: 'credit', clientId: 'client', status: 'APPROVED', paymentFrequency: 'WEEKLY', documentDate: new Date('2026-01-01Z'), generatedDocuments: { contract: true }, penaltyTerms: { method: 'SIMPLE', rate: 0.01, capRate: 0.1, fixedDailyAmount: 1, graceDays: 0 }, schedules: [{ id: 'one', installmentNo: 1 }, { id: 'two', installmentNo: 2 }] };
  const tx = {
    $queryRaw: jest.fn(),
    credit: { findFirst: jest.fn(async () => credit), update: jest.fn(async ({ data }) => Object.assign(credit, data)) },
    paymentSchedule: { update: jest.fn() },
  };
  const service = new CreditsService({ $transaction: async (run) => run(tx), appUser: { findFirst: async () => ({ id: 'cashier' }) } });
  service.getOrganization = async () => ({ id: 'org' });
  service.findApprovedByClient = async () => [];
  return { service, tx, credit };
};

beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2026-09-09T15:00:00Z')));
afterEach(() => jest.useRealTimers());

test('preparing documents resets old confirmations and aligns dates with disbursement day', async () => {
  const { service, tx, credit } = setup();
  await service.prepareDocuments('credit');
  expect(credit.generatedDocuments).toEqual({});
  expect(credit.documentDate).toEqual(new Date('2026-09-09Z'));
  expect(tx.paymentSchedule.update).toHaveBeenNthCalledWith(1, { where: { id: 'one' }, data: { dueDate: new Date('2026-09-09Z') } });
  expect(tx.paymentSchedule.update).toHaveBeenNthCalledWith(2, { where: { id: 'two' }, data: { dueDate: new Date('2026-09-16Z') } });
  await service.confirmDocument('credit', { type: 'contract', date: '2026-09-09' });
  await service.prepareDocuments('credit');
  expect(credit.generatedDocuments.contract).toBe(true);
  expect(tx.paymentSchedule.update).toHaveBeenCalledTimes(2);
});

test('API rejects disbursement with missing or outdated documents', async () => {
  const { service, tx } = setup();
  await expect(service.disburse('credit', { userId: 'cashier' })).rejects.toThrow('Genere contrato');
  expect(tx.credit.update).not.toHaveBeenCalled();
  await service.prepareDocuments('credit');
  await expect(service.disburse('credit', { userId: 'cashier' })).rejects.toThrow('Genere contrato');
  await expect(service.confirmDocument('credit', { type: 'contract', date: '2026-09-08' })).rejects.toThrow('regenerarse');
});
