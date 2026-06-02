import type { CashSession } from './types';

export const getCashDifference = (session: CashSession) => {
  if (session.countedAmount === null) return null;
  return session.countedAmount - session.expectedAmount;
};
