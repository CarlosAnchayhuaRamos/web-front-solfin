import type { CashDenomination, CashSession } from './types';

export const currencyDenominations: CashDenomination[] = [
  { label: 'S/ 200', value: 200 },
  { label: 'S/ 100', value: 100 },
  { label: 'S/ 50', value: 50 },
  { label: 'S/ 20', value: 20 },
  { label: 'S/ 10', value: 10 },
  { label: 'S/ 5', value: 5 },
  { label: 'S/ 2', value: 2 },
  { label: 'S/ 1', value: 1 },
  { label: 'S/ 0.50', value: 0.5 },
  { label: 'S/ 0.20', value: 0.2 },
  { label: 'S/ 0.10', value: 0.1 },
];

export const cashBoxes = ['Caja principal', 'Caja auxiliar'];

export const cashSessions: CashSession[] = [
  {
    cashBox: 'Caja principal',
    cashier: 'Elena Torres',
    countedAmount: null,
    difference: null,
    denominations: [
      { label: 'S/ 100', quantity: 20, value: 100 },
      { label: 'S/ 50', quantity: 20, value: 50 },
    ],
    expectedAmount: 12480,
    id: 'CAJ-001',
    openingAmount: 3000,
    status: 'OPEN',
  },
  {
    cashBox: 'Caja auxiliar',
    cashier: 'Miguel Rojas',
    countedAmount: 4120,
    difference: 0,
    denominations: [
      { label: 'S/ 100', quantity: 10, value: 100 },
      { label: 'S/ 50', quantity: 10, value: 50 },
    ],
    expectedAmount: 4120,
    id: 'CAJ-002',
    openingAmount: 1500,
    status: 'CLOSED',
  },
];
