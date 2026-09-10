const { DashboardService } = require('../../src/dashboard/dashboard.service');

const createPrisma = () => ({
  organization: { upsert: jest.fn().mockResolvedValue({ id: 'org-1' }) },
  paymentSchedule: { aggregate: jest.fn().mockResolvedValue({ _sum: { totalDue: 1000, penalty: 20, paidAmount: 120 }, _count: 2 }) },
  credit: { count: jest.fn().mockResolvedValue(2), groupBy: jest.fn().mockResolvedValue([{ clientId: 'client-1' }]) },
  approvalRequest: { count: jest.fn().mockResolvedValue(1) },
  payment: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 120 } }) },
  cashSession: { findMany: jest.fn().mockResolvedValue([
    { id: 'session-1', openingAmount: 1000, openedAt: new Date('2026-09-10T13:00:00Z'), cashBox: { name: 'Caja 1' }, user: { fullName: 'Cajero' } },
  ]) },
  cashMovement: { groupBy: jest.fn().mockImplementation(({ by }) => {
    if (by.includes('type')) return Promise.resolve([{ type: 'PAYMENT_COLLECTION', _sum: { amount: 200 } }, { type: 'CREDIT_DISBURSEMENT', _sum: { amount: 50 } }]);
    return Promise.resolve([{ cashSessionId: 'session-1', direction: 'IN', _sum: { amount: 300 } }, { cashSessionId: 'session-1', direction: 'OUT', _sum: { amount: 50 } }]);
  }) },
  vault: { findFirst: jest.fn().mockResolvedValue({ balance: 28750, openedAt: new Date() }) },
});

describe('Dashboard role scopes', () => {
  afterEach(() => jest.useRealTimers());

  it('returns only own cash operations, without querying portfolio or vault for cashier', async () => {
    const prisma = createPrisma();
    const summary = await new DashboardService(prisma).getSummary({ sub: 'cashier-1', role: 'CASHIER' });
    expect(summary.scope).toBe('OWN_CASH');
    expect(summary.portfolio).toBeNull();
    expect(summary.cash.vault).toBeNull();
    expect(prisma.vault.findFirst).not.toHaveBeenCalled();
    expect(prisma.credit.count).not.toHaveBeenCalled();
    expect(prisma.cashSession.findMany.mock.calls[0][0].where).toMatchObject({ userId: 'cashier-1', cashBox: { organizationId: 'org-1' } });
    for (const [query] of prisma.cashMovement.groupBy.mock.calls) {
      expect(query.where.cashSession).toMatchObject({ userId: 'cashier-1', cashBox: { organizationId: 'org-1' } });
    }
    expect(summary.cash.sessions[0].balance).toBe(1250);
    expect(summary.cash.collectedToday).toBe(200);
    expect(summary.cash.disbursedToday).toBe(50);
  });

  it('restricts every portfolio query to the analyst and excludes cash data', async () => {
    const prisma = createPrisma();
    const summary = await new DashboardService(prisma).getSummary({ sub: 'analyst-1', role: 'ANALYST' });
    expect(summary.scope).toBe('ANALYST_PORTFOLIO');
    expect(summary.cash).toBeNull();
    expect(prisma.cashSession.findMany).not.toHaveBeenCalled();
    expect(prisma.vault.findFirst).not.toHaveBeenCalled();
    for (const [query] of prisma.paymentSchedule.aggregate.mock.calls) {
      expect(query.where.credit).toMatchObject({ analystId: 'analyst-1', organizationId: 'org-1' });
    }
    for (const [query] of prisma.credit.count.mock.calls) expect(query.where.analystId).toBe('analyst-1');
    expect(prisma.credit.groupBy.mock.calls[0][0].where.analystId).toBe('analyst-1');
    expect(prisma.approvalRequest.count.mock.calls[0][0].where.requestedById).toBe('analyst-1');
    expect(prisma.payment.aggregate.mock.calls[0][0].where.credit).toEqual({ analystId: 'analyst-1', organizationId: 'org-1' });
    expect(summary.portfolio.portfolioAmount).toBe(900);
    expect(summary.portfolio.dueTodayCount).toBe(2);
  });

  it('includes the general portfolio, vault and all cashiers for admin', async () => {
    const prisma = createPrisma();
    const summary = await new DashboardService(prisma).getSummary({ sub: 'admin-1', role: 'ADMIN' });
    expect(summary.scope).toBe('GENERAL');
    expect(summary.portfolio).not.toBeNull();
    expect(summary.cash.vault).toEqual({ balance: 28750, isOpen: true });
    expect(prisma.cashSession.findMany.mock.calls[0][0].where.userId).toBeUndefined();
    expect(prisma.credit.count.mock.calls[0][0].where.analystId).toBeUndefined();
  });

  it('uses the Peru day for events and UTC calendar dates for schedules, including final payments', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-11T03:00:00Z'));
    const prisma = createPrisma();
    await new DashboardService(prisma).getSummary({ sub: 'admin-1', role: 'ADMIN' });
    const paymentWhere = prisma.payment.aggregate.mock.calls[0][0].where;
    expect(paymentWhere.credit.status).toBeUndefined();
    expect(paymentWhere.paidAt).toEqual({ gte: new Date('2026-09-10T05:00:00Z'), lt: new Date('2026-09-11T05:00:00Z') });
    const dueQuery = prisma.paymentSchedule.aggregate.mock.calls.find(([query]) => query._count)[0];
    expect(dueQuery.where.dueDate).toEqual({ gte: new Date('2026-09-10T00:00:00Z'), lt: new Date('2026-09-11T00:00:00Z') });
  });
});
