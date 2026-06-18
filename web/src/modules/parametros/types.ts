export interface SettingItem {
  id: string;
  label: string;
  value: string;
  description: string;
}

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

export interface PenaltyFrequencyFormState {
  capRate: string;
  fixedDailyAmount: string;
  graceDays: string;
  method: PenaltyMethod;
  rate: string;
}

export type PenaltySettingsFormState = Record<PaymentFrequencyKey, PenaltyFrequencyFormState>;

export interface CreditPolicy {
  defaultInterestRate: number;
  defaultPenaltyRate: number;
  graceDays: number;
  maxAnalystApprovalAmount: number;
  maxInstallments: number;
  maxRequestFiles: number;
  penaltySettings: PenaltySettings;
  requireApprovalAboveLimit: boolean;
}

export interface CreditPolicyFormState {
  defaultInterestRate: string;
  defaultPenaltyRate: string;
  graceDays: string;
  maxAnalystApprovalAmount: string;
  maxInstallments: string;
  maxRequestFiles: string;
  penaltySettings: PenaltySettingsFormState;
  requireApprovalAboveLimit: boolean;
}

export interface CashPolicy {
  allowNegativeCash: boolean;
  maxCashDifference: number;
  maxCashBoxBalance: number;
  requireDailyClosing: boolean;
  vaultWarningThreshold: number;
}

export interface CashPolicyFormState {
  allowNegativeCash: boolean;
  maxCashDifference: string;
  maxCashBoxBalance: string;
  requireDailyClosing: boolean;
  vaultWarningThreshold: string;
}
