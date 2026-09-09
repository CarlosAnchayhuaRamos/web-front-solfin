import { getPenaltyClause } from './lib';

test('contract distinguishes fixed, simple and capped penalty terms', () => {
  const terms = { method: 'FIXED_DAILY', fixedDailyAmount: 2.5, graceDays: 2, rate: 0.01, capRate: 0.15 };
  expect(getPenaltyClause(terms)).toContain('S/ 2.50');
  expect(getPenaltyClause(terms)).not.toContain('anual');
  expect(getPenaltyClause({ ...terms, method: 'SIMPLE' })).toContain('1.000% diario');
  expect(getPenaltyClause({ ...terms, method: 'CAPPED_SIMPLE' })).toContain('15.000%');
  expect(getPenaltyClause(terms)).toContain('2 dias de gracia');
});
