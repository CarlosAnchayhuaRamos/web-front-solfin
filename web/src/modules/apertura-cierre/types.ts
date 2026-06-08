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
