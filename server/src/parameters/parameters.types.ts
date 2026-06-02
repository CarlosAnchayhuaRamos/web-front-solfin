export interface CreditPolicyDto {
  defaultInterestRate: number;
  defaultPenaltyRate: number;
  graceDays: number;
  maxAnalystApprovalAmount: number;
  maxInstallments: number;
  maxRequestFiles: number;
  requireApprovalAboveLimit: boolean;
}

export interface UpdateCreditPolicyInput {
  defaultInterestRate: number;
  defaultPenaltyRate: number;
  graceDays: number;
  maxAnalystApprovalAmount: number;
  maxInstallments: number;
  maxRequestFiles: number;
  requireApprovalAboveLimit: boolean;
}

export interface CashPolicyDto {
  allowNegativeCash: boolean;
  maxCashBoxBalance: number;
  requireDailyClosing: boolean;
  vaultWarningThreshold: number;
}

export interface UpdateCashPolicyInput {
  allowNegativeCash: boolean;
  maxCashBoxBalance: number;
  requireDailyClosing: boolean;
  vaultWarningThreshold: number;
}
