const { ReportsService } = require('../../src/reports/reports.service');

test('portfolio sums contractual installments per client without replacing credit totals', async () => {
  const credit = {
    clientId: 'client-1', client: { dni: '12345678', firstName: 'Cliente', lastName: 'Prueba', phone: '999111222' },
    principalAmount: 1000, schedules: [],
  };
  const prisma = {
    organization: { upsert: jest.fn().mockResolvedValue({ id: 'org-1' }) },
    credit: { findMany: jest.fn().mockResolvedValue([
      { ...credit, installmentAmount: '52.35' },
      { ...credit, installmentAmount: '24.10' },
    ]) },
  };
  const report = await new ReportsService(prisma).getPortfolioReport({ sub: 'analyst-1', role: 'ANALYST' });
  expect(report.clients).toHaveLength(1);
  expect(report.clients[0]).toMatchObject({ installmentAmount: 76.45, creditCount: 2 });
  expect(report.summary.creditCount).toBe(2);
  expect(prisma.credit.findMany.mock.calls[0][0].where.analystId).toBe('analyst-1');
});
