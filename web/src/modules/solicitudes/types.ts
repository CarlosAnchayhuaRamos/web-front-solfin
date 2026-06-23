export type CreditStatusColor = 'blue' | 'yellow' | 'red' | 'gray' | 'black';
export type PaymentFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type InterestCalculationMethod = 'CONTINUOUS' | 'EQUAL_INSTALLMENTS';

export interface CreditStatusInfo {
  label: string;
  color: CreditStatusColor;
}

export interface ApprovalRequest {
  id: string;
  creditCode: string;
  creditId: string;
  clientName: string;
  analystName: string;
  creditType: 'Express' | 'Garantia';
  amount: number;
  analystLimit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  requestedAt: string;
  reviewerNotes: string | null;
  files: ApprovalRequestFile[];
}

export interface ApprovalRequestFile {
  fileName: string;
  id: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
}

export interface ApprovalRequestFilters {
  dateFrom: string;
  dateTo: string;
  status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
}

export interface CreditContractData {
  advisorName: string;
  approvedAt: string;
  approvedByName: string;
  clientAddress: string | null;
  clientDni: string;
  clientName: string;
  creditCode: string;
  installmentAmount: number;
  installmentCount: number;
  interestCalculationMethod: InterestCalculationMethod;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
  penaltyRate: number;
  principalAmount: number;
  schedules: CreditContractSchedule[];
  totalAmount: number;
}

export interface CreditContractSchedule {
  dueDate: string;
  installmentNo: number;
  interest: number;
  principal: number;
  totalDue: number;
}

export interface ReviewApprovalResult {
  contract: CreditContractData | null;
  request: ApprovalRequest;
}
