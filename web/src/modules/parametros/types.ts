export interface SettingItem {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface CreditPolicy {
  defaultInterestRate: number;
  defaultPenaltyRate: number;
  graceDays: number;
  maxAnalystApprovalAmount: number;
  maxInstallments: number;
  maxRequestFiles: number;
  requireApprovalAboveLimit: boolean;
}

export interface CreditPolicyFormState {
  defaultInterestRate: string;
  defaultPenaltyRate: string;
  graceDays: string;
  maxAnalystApprovalAmount: string;
  maxInstallments: string;
  maxRequestFiles: string;
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
