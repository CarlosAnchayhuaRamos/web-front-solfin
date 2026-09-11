export interface Client {
  referenceName: string | null;
  personalAddressReference: string | null;
  businessAddressReference: string | null;
  referencePhone: string | null;
  businessRuc: string | null;
  businessName: string | null;
  businessPhone: string | null;
  businessActivity: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
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
  referenceName: string;
  personalAddressReference: string;
  businessAddressReference: string;
  referencePhone: string;
  businessRuc: string;
  businessName: string;
  businessPhone: string;
  businessActivity: string;
  department: string;
  province: string;
  district: string;
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
  latestPaymentId: string | null;
  latestPaymentAmount: number | null;
  files: Array<{ id: string; fileName: string; sizeBytes: number }>;
  documentDate: string | null;
  generatedDocuments: CreditDocumentChecklist;
  penaltyTerms: import('../parametros/types').PenaltyFrequencySetting;
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

export interface CreditReversalRequest {
  kind: 'CANCEL_CREDIT' | 'REVERSE_PAYMENT';
  requestId: string;
  reason: string;
  cashSessionId?: string;
  latestPaymentId?: string;
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

export interface PendingPaymentRequest {
  amount: number;
  requestId: string;
}

export interface ReversalVoucher {
  voucherCode: string;
  originalVoucherCode: string | null;
  creditCode: string;
  clientName: string;
  clientDni: string;
  administratorName: string;
  cashBox: string | null;
  reversedAt: string;
  reason: string;
  amount: number;
  cashDirection: 'IN' | 'OUT' | null;
  remainingBalance: number;
  details: Array<{
    installmentNo: number;
    amount: number;
    baseAmount: number;
    penaltyAmount: number;
  }>;
}
export interface ClientPage {
  items: Client[];
  total: number;
  page: number;
  pageSize: number;
}
