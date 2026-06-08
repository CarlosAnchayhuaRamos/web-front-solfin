import type { CashDenomination, CashDenominationCount, CashSession } from './types';

export const getCashDifference = (session: CashSession) => {
  if (session.countedAmount === null) return null;
  return session.countedAmount - session.expectedAmount;
};

export const getDenominationTotal = (denominations: CashDenomination[], quantities: Record<string, string>) => {
  return denominations.reduce((total, denomination) => {
    const quantity = Number(quantities[denomination.label] ?? 0);

    if (Number.isNaN(quantity)) return total;
    return total + denomination.value * quantity;
  }, 0);
};

export const getDenominationCounts = (
  denominations: CashDenomination[],
  quantities: Record<string, string>,
): CashDenominationCount[] => {
  return denominations
    .map((denomination) => ({
      label: denomination.label,
      quantity: Number(quantities[denomination.label] ?? 0),
      value: denomination.value,
    }))
    .filter((denomination) => denomination.quantity > 0);
};

export const getDenominationSummary = (session: CashSession) => {
  const denominations = session.status === 'CLOSED' ? session.closingDenominations : session.denominations;

  if (!denominations?.length) return 'Sin detalle';
  return denominations.map((denomination) => `${denomination.label} x ${denomination.quantity}`).join(', ');
};
