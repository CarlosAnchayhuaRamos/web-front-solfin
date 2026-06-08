export interface CashDenominationCountDto {
  label: string;
  quantity: number;
  value: number;
}

export interface CashSessionDto {
  id: string;
  cashBox: string;
  cashier: string;
  closingDenominations: CashDenominationCountDto[];
  countedAmount: number | null;
  denominations: CashDenominationCountDto[];
  difference: number | null;
  expectedAmount: number;
  openingAmount: number;
  status: 'OPEN' | 'CLOSED';
}

export interface CashBoxDto {
  assignedCashierId: string | null;
  assignedCashierName: string | null;
  id: string;
  isActive: boolean;
  name: string;
}

export interface CashierDto {
  fullName: string;
  id: string;
}

export interface AssignCashBoxInput {
  cashierId: string;
}

export interface CreateCashBoxInput {
  name: string;
}

export interface OpenCashSessionInput {
  cashBoxName: string;
  cashierName: string;
  denominations: CashDenominationCountDto[];
  openingAmount: number;
  userId: string;
}

export interface CloseCashSessionInput {
  countedAmount: number;
  denominations: CashDenominationCountDto[];
}

export interface VaultOpeningDto {
  balance: number;
  isOpen: boolean;
  vaultName: string;
}
