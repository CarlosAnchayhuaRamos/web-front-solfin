export interface CreditProductOption {
  id: string;
  label: string;
  maxAmount: number;
  defaultInstallments: number;
  requiresGuarantee: boolean;
}

export type CreditProductType = 'EXPRESS' | 'GARANTIA';

export interface CreditFormState {
  amount: string;
  clientId: string;
  clientSearch: string;
  files: File[];
  installments: string;
  notes: string;
  productType: CreditProductType;
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

export interface RegisteredCreditClient {
  firstName: string;
  lastName: string;
}

export interface RegisteredCreditSchedule {
  dueDate: string;
  installmentNo: number;
  interest: number;
  principal: number;
  totalDue: number;
}

export interface RegisteredCredit {
  client: RegisteredCreditClient;
  code: string;
  contract: RegisteredCreditContract | null;
  installmentAmount: number;
  interestRate: number;
  principalAmount: number;
  schedules: RegisteredCreditSchedule[];
  status: string;
  totalAmount: number;
}

export interface RegisteredCreditContract {
  advisorName: string;
  approvedAt: string;
  approvedByName: string;
  clientAddress: string | null;
  clientDni: string;
  clientName: string;
  creditCode: string;
  installmentAmount: number;
  installmentCount: number;
  interestRate: number;
  penaltyRate: number;
  principalAmount: number;
  schedules: RegisteredCreditSchedule[];
  totalAmount: number;
}
