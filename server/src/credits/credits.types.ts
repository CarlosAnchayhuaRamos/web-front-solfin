import { CreditType } from '@prisma/client';

export interface CreditSimulationInput {
  amount: number;
  installments: number;
  productType: CreditType;
}

export interface CreateCreditInput extends CreditSimulationInput {
  clientId: string;
  fileNames?: string[];
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
  installmentAmount: number;
  installments: PaymentScheduleItem[];
  totalAmount: number;
}

export interface PayInstallmentsInput {
  amount: number;
  userId: string;
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
