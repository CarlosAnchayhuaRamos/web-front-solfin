import { CreditType, InterestCalculationMethod, PaymentFrequency } from '@prisma/client';

export interface CreditSimulationInput {
  amount: number;
  clientId?: string;
  interestCalculationMethod: InterestCalculationMethod;
  interestRate?: number;
  installments: number;
  paymentFrequency: PaymentFrequency;
  productType: CreditType;
}

export interface CreateCreditInput extends CreditSimulationInput {
  clientId: string;
  fileNames?: string[];
  documentIds?: string[];
  notes?: string;
}

export interface AssignCreditAdvisorInput {
  advisorId: string;
}

export interface PaymentScheduleItem {
  installmentNo: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalDue: number;
}

export interface CreditSimulationResult {
  amount: number;
  interestRate: number;
  interestCalculationMethod: InterestCalculationMethod;
  installmentAmount: number;
  installments: PaymentScheduleItem[];
  paymentFrequency: PaymentFrequency;
  totalAmount: number;
}

export interface PayInstallmentsInput {
  amount: number;
  userId: string;
  requestId: string;
}

export interface ConfirmCreditDocumentInput {
  type: 'contract' | 'schedule' | 'disbursementRequest';
  date: string;
}

export interface PenaltyScheduleState {
  dueDate: Date;
  paidAmount: unknown;
  penalty: unknown;
  penaltyPaid: unknown;
  penaltyAccruedDays: number;
  status: string;
  totalDue: unknown;
}

export interface DisburseCreditInput {
  userId: string;
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
