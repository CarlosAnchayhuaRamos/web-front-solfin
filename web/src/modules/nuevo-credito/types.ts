export interface CreditProductOption {
  id: string;
  label: string;
  maxAmount: number;
  defaultInstallments: number;
  requiresGuarantee: boolean;
}

export type CreditProductType = 'EXPRESS' | 'GARANTIA';
export type PaymentFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type InterestCalculationMethod = 'CONTINUOUS' | 'EQUAL_INSTALLMENTS';

export interface CreditFormState {
  amount: string;
  clientId: string;
  clientSearch: string;
  files: File[];
  installments: string;
  interestCalculationMethod: InterestCalculationMethod;
  interestRate: string;
  notes: string;
  paymentFrequency: PaymentFrequency;
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
  interestCalculationMethod: InterestCalculationMethod;
  interestRate: number;
  installmentAmount: number;
  installments: PaymentScheduleItem[];
  paymentFrequency: PaymentFrequency;
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
  interestCalculationMethod: InterestCalculationMethod;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
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
  interestCalculationMethod: InterestCalculationMethod;
  interestRate: number;
  paymentFrequency: PaymentFrequency;
  penaltyRate: number;
  principalAmount: number;
  schedules: RegisteredCreditSchedule[];
  totalAmount: number;
}
