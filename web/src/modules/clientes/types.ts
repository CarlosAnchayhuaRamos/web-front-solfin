export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dni: string;
  phone: string;
  email: string | null;
  personalAddress: string | null;
  businessAddress: string | null;
  birthDate: string | null;
  activeCredits: number;
  totalDebt: number;
  status: ClientStatus;
}

export type ClientStatus = 'ACTIVE' | 'WATCHLIST' | 'BLOCKED' | 'INACTIVE';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  personalAddress: string;
  businessAddress: string;
  birthDate: string;
  status: ClientStatus;
}

export interface UpdateClientInput extends CreateClientInput {}

export interface ClientFormState extends CreateClientInput {}

export interface ClientFilters {
  dni: string;
  name: string;
}

export interface ClientCreditSchedule {
  dueDate: string;
  id: string;
  installmentNo: number;
  interest: number;
  paidAmount: number;
  penalty: number;
  principal: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELED';
  totalDue: number;
}

export interface ClientCredit {
  code: string;
  disbursementCashBox: string | null;
  id: string;
  installmentAmount: number;
  interestRate: number;
  netValue: number;
  overdueAmount: number;
  principalAmount: number;
  schedules: ClientCreditSchedule[];
  status: string;
  totalAmount: number;
  type: string;
}

export interface OpenCashSession {
  cashBox: string;
  expectedAmount: number;
  id: string;
  status: 'OPEN' | 'CLOSED';
  userId: string;
}

export interface CreditDisbursement {
  amount: number;
  cashBox: string;
  cashSessionId: string;
  creditCode: string;
  disbursedAt: string;
}

export interface PaymentVoucher {
  amount: number;
  clientName: string;
  creditCode: string;
  paidAt: string;
  scheduleNumbers: number[];
  voucherCode: string;
}
