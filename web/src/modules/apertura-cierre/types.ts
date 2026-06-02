export interface CashSession {
  id: string;
  cashBox: string;
  cashier: string;
  openingAmount: number;
  expectedAmount: number;
  countedAmount: number | null;
  status: 'OPEN' | 'CLOSED';
}
