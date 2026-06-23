export type PenaltyMethod = 'SIMPLE' | 'CAPPED_SIMPLE' | 'FIXED_DAILY';

export type PaymentFrequencyKey = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface PenaltyFrequencySetting {
  capRate: number;
  fixedDailyAmount: number;
  graceDays: number;
  method: PenaltyMethod;
  rate: number;
}

export type PenaltySettings = Record<PaymentFrequencyKey, PenaltyFrequencySetting>;

export interface CreditPolicyDto {
  defaultInterestRate: number;
  defaultPenaltyRate: number;
  graceDays: number;
  maxAnalystApprovalAmount: number;
  maxInstallments: number;
  maxRequestFiles: number;
  penaltySettings: PenaltySettings;
  requireApprovalAboveLimit: boolean;
  specialInterestRate: number;
}

export interface UpdateCreditPolicyInput {
  defaultInterestRate: number;
  defaultPenaltyRate: number;
  graceDays: number;
  maxAnalystApprovalAmount: number;
  maxInstallments: number;
  maxRequestFiles: number;
  penaltySettings: PenaltySettings;
  requireApprovalAboveLimit: boolean;
  specialInterestRate: number;
}

export interface CashPolicyDto {
  allowNegativeCash: boolean;
  maxCashDifference: number;
  maxCashBoxBalance: number;
  requireDailyClosing: boolean;
  vaultWarningThreshold: number;
}

export interface UpdateCashPolicyInput {
  allowNegativeCash: boolean;
  maxCashDifference: number;
  maxCashBoxBalance: number;
  requireDailyClosing: boolean;
  vaultWarningThreshold: number;
}
