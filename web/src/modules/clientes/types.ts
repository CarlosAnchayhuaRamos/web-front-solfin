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
  isSpecial: boolean;
  specialInterestRate: number | null;
  activeCredits: number;
  totalDebt: number;
  status: ClientStatus;
}

export type ClientStatus = 'ACTIVE' | 'WATCHLIST' | 'BLOCKED' | 'INACTIVE';
export type PaymentFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type InterestCalculationMethod = 'CONTINUOUS' | 'EQUAL_INSTALLMENTS';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  personalAddress: string;
  businessAddress: string;
  birthDate: string;
  isSpecial: boolean;
  specialInterestRate: string;
  status: ClientStatus;
}

export interface UpdateClientInput extends CreateClientInput {}

export interface ClientFormState extends CreateClientInput {}

export interface ClientFilters {
  dni: string;
  name: string;
}

export type CreditDocumentType = 'schedule' | 'contract' | 'disbursementRequest';

export interface CreditDocumentChecklist {
  contract: boolean;
  disbursementRequest: boolean;
  schedule: boolean;
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
  advisorId: string;
  advisorName: string;
  approvedAt: string;
  approvedByName: string | null;
  code: string;
  id: string;
  installmentAmount: number;
  interestCalculationMethod: InterestCalculationMethod;
  interestRate: number;
  netValue: number;
  overdueAmount: number;
  paymentFrequency: PaymentFrequency;
  penaltyRate: number;
  principalAmount: number;
  schedules: ClientCreditSchedule[];
  status: string;
  totalAmount: number;
  type: string;
}

export interface CreditAdvisor {
  fullName: string;
  id: string;
  role: 'ADMIN' | 'ANALYST';
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
  cashierName: string;
  clientDni: string;
  clientName: string;
  creditCode: string;
  paidAt: string;
  remainingBalance: number;
  scheduleNumbers: number[];
  voucherCode: string;
}
