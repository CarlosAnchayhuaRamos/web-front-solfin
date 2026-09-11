const { accruedPenalty, creditDueDate, limaDate, readPenaltyTerms } = require('../../src/credits/credits.lib');
const { AuthGuard } = require('../../src/auth/auth.guard');
const { BootstrapAdminService } = require('../../src/auth/bootstrap-admin.service');
const { CreditsController } = require('../../src/credits/credits.controller');
const { createHmac } = require('crypto');

const setting = { method: 'SIMPLE', rate: 0.01, capRate: 0.15, fixedDailyAmount: 2, graceDays: 0 };
const initial = { dueDate: new Date('2026-01-01Z'), totalDue: 100, paidAmount: 0, penalty: 0, penaltyPaid: 0, penaltyAccruedDays: 0, status: 'PENDING' };

test('partial payments preserve mora already accrued and charge only new days on new balance', () => {
  expect(accruedPenalty(initial, setting, new Date('2026-01-11Z'))).toBe(10);
  const partial = { ...initial, paidAmount: 50, penalty: 10, penaltyAccruedDays: 10, status: 'PARTIAL' };
  expect(accruedPenalty(partial, setting, new Date('2026-01-11Z'))).toBe(10);
  expect(accruedPenalty(partial, setting, new Date('2026-01-13Z'))).toBe(11);
  expect(accruedPenalty({ ...partial, paidAmount: 100 }, setting, new Date('2026-01-20Z'))).toBe(10);
});

test('capped and fixed mora preserve history after abonos', () => {
  expect(accruedPenalty(initial, { ...setting, method: 'CAPPED_SIMPLE' }, new Date('2026-02-01Z'))).toBe(15);
  const partial = { ...initial, paidAmount: 50, penalty: 15, penaltyAccruedDays: 31 };
  expect(accruedPenalty(partial, { ...setting, method: 'CAPPED_SIMPLE' }, new Date('2026-02-05Z'))).toBe(15);
  expect(accruedPenalty(initial, { ...setting, method: 'FIXED_DAILY', graceDays: 2 }, new Date('2026-01-06Z'))).toBe(6);
});

test('due dates use Lima, clamp end of month, preserve first installment rule', () => {
  const base = limaDate(new Date('2026-02-01T02:00:00Z'));
  expect(base.toISOString().slice(0, 10)).toBe('2026-01-31');
  expect(creditDueDate('DAILY', 1, base).toISOString().slice(0, 10)).toBe('2026-02-02');
  expect(creditDueDate('WEEKLY', 1, base).toISOString().slice(0, 10)).toBe('2026-02-07');
  expect(creditDueDate('WEEKLY', 2, base).toISOString().slice(0, 10)).toBe('2026-02-14');
  expect(creditDueDate('MONTHLY', 1, base)).toEqual(base);
  expect(creditDueDate('MONTHLY', 2, base).toISOString().slice(0, 10)).toBe('2026-02-28');
  expect(creditDueDate('MONTHLY', 3, base).toISOString().slice(0, 10)).toBe('2026-03-31');
});

test('missing stored terms fail explicitly rather than use current policy', () => {
  expect(() => readPenaltyTerms(null)).toThrow('sin condiciones');
  expect(readPenaltyTerms(setting)).toEqual(setting);
});

const token = (payload) => {
  const body = [Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'), Buffer.from(JSON.stringify(payload)).toString('base64url')].join('.');
  return `${body}.${createHmac('sha256', 'test-secret').update(body).digest('base64url')}`;
};

test('disabled and deleted users lose access even with valid tokens; roles use DB', async () => {
  const db = { appUser: { findUnique: jest.fn().mockResolvedValue({ isActive: false, role: 'ADMIN' }) } };
  const reflector = { getAllAndOverride: jest.fn().mockReturnValueOnce(false).mockReturnValue(['ADMIN']) };
  const guard = new AuthGuard({ get: () => 'test-secret' }, reflector, db);
  const request = { headers: { authorization: `Bearer ${token({ sub: 'a', role: 'ADMIN', exp: 9999999999 })}` } };
  const context = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => request }) };
  await expect(guard.canActivate(context)).rejects.toThrow('inactivo');
  reflector.getAllAndOverride.mockReset().mockReturnValueOnce(false).mockReturnValueOnce(['ADMIN']);
  db.appUser.findUnique.mockResolvedValue({ isActive: true, role: 'CASHIER' });
  await expect(guard.canActivate(context)).rejects.toThrow('No autorizado');
  expect(() => guard.verifyToken(token({ sub: 'a', role: 'ADMIN' }))).toThrow();
});

test('daily due dates skip Sundays across weeks and preserve the supplied base', () => {
  const base = new Date('2026-01-31T00:00:00Z');
  expect(creditDueDate('DAILY', 6, base).toISOString().slice(0, 10)).toBe('2026-02-07');
  expect(creditDueDate('DAILY', 7, base).toISOString().slice(0, 10)).toBe('2026-02-09');
  expect(base.toISOString().slice(0, 10)).toBe('2026-01-31');
});

test('bootstrap leaves existing accounts untouched', async () => {
  const db = { appUser: { count: jest.fn().mockResolvedValue(2) }, $transaction: jest.fn() };
  const bootstrap = new BootstrapAdminService({ get: jest.fn() }, db);
  await bootstrap.onModuleInit();
  expect(db.$transaction).not.toHaveBeenCalled();
});

test('payment and disbursement actors come from authenticated user', () => {
  const service = { payInstallments: jest.fn(), disburse: jest.fn() };
  const controller = new CreditsController(service);
  controller.payInstallments('credit', { amount: 100, userId: 'victim', requestId: 'key' }, { sub: 'cashier' });
  controller.disburse('credit', { userId: 'victim' }, { sub: 'cashier' });
  expect(service.payInstallments).toHaveBeenCalledWith('credit', { amount: 100, userId: 'cashier', requestId: 'key' });
  expect(service.disburse).toHaveBeenCalledWith('credit', { userId: 'cashier' });
});
