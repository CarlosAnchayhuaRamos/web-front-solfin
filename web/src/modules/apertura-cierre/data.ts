import type { CashSession } from './types';

export const cashSessions: CashSession[] = [
  { cashBox: 'Caja principal', cashier: 'Elena Torres', countedAmount: null, expectedAmount: 12480, id: 'CAJ-001', openingAmount: 3000, status: 'OPEN' },
  { cashBox: 'Caja auxiliar', cashier: 'Miguel Rojas', countedAmount: 4120, expectedAmount: 4120, id: 'CAJ-002', openingAmount: 1500, status: 'CLOSED' },
];
