const { CreditsService } = require('../../src/credits/credits.service');

const createService = () => new CreditsService({});

describe('CreditsService calculation helpers', () => {
  it('builds equal-installment schedules with fixed total, falling interest, and rising principal', () => {
    const service = createService();
    const schedule = service.getEqualInstallmentSchedule(1000, 12, 'MONTHLY', 0.05);

    expect(schedule).toHaveLength(12);
    expect(schedule[0]).toMatchObject({
      installmentNo: 1,
      interest: 50,
      principal: 62.83,
      totalDue: 112.83,
    });
    expect(schedule[1].totalDue).toBe(112.83);
    expect(schedule[1].interest).toBeLessThan(schedule[0].interest);
    expect(schedule[1].principal).toBeGreaterThan(schedule[0].principal);

    const totalPrincipal = schedule.reduce((total, installment) => total + installment.principal, 0);
    expect(totalPrincipal).toBeCloseTo(1000, 2);
  });

  it('builds continuous-interest schedules using exponential monthly interest', () => {
    const service = createService();
    const schedule = service.getContinuousInterestSchedule(1000, 2, 'MONTHLY', 0.1);

    expect(schedule).toHaveLength(2);
    expect(schedule[0].principal).toBe(500);
    expect(schedule[0].interest).toBe(110.7);
    expect(schedule[1].principal).toBe(500);
    expect(schedule[1].interest).toBeCloseTo(110.7, 2);
    expect(schedule.reduce((total, installment) => total + installment.totalDue, 0)).toBeCloseTo(1221.4, 2);
  });

  it('uses override, client special rate, policy special rate, then default rate', () => {
    const service = createService();
    const policy = { defaultInterestRate: 0.12, specialInterestRate: 0.09 };

    expect(service.getCreditInterestRate({ interestRate: 0.07 }, policy, null)).toBe(0.07);
    expect(service.getCreditInterestRate({}, policy, { isSpecial: true, specialInterestRate: 0.08 })).toBe(0.08);
    expect(service.getCreditInterestRate({}, policy, { isSpecial: true, specialInterestRate: null })).toBe(0.09);
    expect(service.getCreditInterestRate({}, policy, { isSpecial: false, specialInterestRate: 0.08 })).toBe(0.12);
  });
});
