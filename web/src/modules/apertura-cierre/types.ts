export interface CashDenomination {
  label: string;
  value: number;
}

export interface CashDenominationCount {
  label: string;
  quantity: number;
  value: number;
}

export interface CashSession {
  id: string;
  cashBox: string;
  cashier: string;
  userId: string;
  closingDenominations?: CashDenominationCount[];
  denominations?: CashDenominationCount[];
  openingAmount: number;
  expectedAmount: number;
  countedAmount: number | null;
  difference: number | null;
  status: 'OPEN' | 'CLOSED';
}

export interface CashBox {
  assignedCashierId: string | null;
  assignedCashierName: string | null;
  id: string;
  isActive: boolean;
  name: string;
}

export interface Cashier {
  fullName: string;
  id: string;
}

export interface UnclosedCashBox {
  cashBox: string;
  cashier: string;
  openedAt: string;
  openingAmount: number;
}

export interface CashCloseReport {
  cashBox: string;
  cashier: string;
  closedAt: string;
  countedAmount: number;
  difference: number;
  expectedAmount: number;
  expenses: number;
  expenseMovements: CashCloseMovement[];
  income: number;
  incomeMovements: CashCloseMovement[];
  openingAmount: number;
}

export interface CashCloseMovement {
  amount: number;
  client: string;
  code: string;
  createdAt: string;
}

export interface VaultCloseReport {
  boxes: CashCloseReport[];
  closedAt: string;
  totalCounted: number;
  totalDifference: number;
  totalExpected: number;
  totalExpenses: number;
  totalIncome: number;
  totalOpening: number;
  vaultName: string;
}
