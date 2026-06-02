import { CreditType } from '@prisma/client';

export interface CreditSimulationInput {
  amount: number;
  installments: number;
  productType: CreditType;
}

export interface CreateCreditInput extends CreditSimulationInput {
  clientId: string;
  notes?: string;
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
  scheduleIds: string[];
}

export interface PaymentVoucher {
  amount: number;
  clientName: string;
  creditCode: string;
  paidAt: string;
  scheduleNumbers: number[];
  voucherCode: string;
}
