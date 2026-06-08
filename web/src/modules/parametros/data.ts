import type { CashPolicyFormState, CreditPolicyFormState, SettingItem } from './types';

export const initialCreditPolicyForm: CreditPolicyFormState = {
  defaultInterestRate: '12',
  defaultPenaltyRate: '0.5',
  graceDays: '2',
  maxAnalystApprovalAmount: '3500',
  maxInstallments: '12',
  maxRequestFiles: '5',
  requireApprovalAboveLimit: true,
};

export const initialCashPolicyForm: CashPolicyFormState = {
  allowNegativeCash: false,
  maxCashDifference: '0.5',
  maxCashBoxBalance: '15000',
  requireDailyClosing: true,
  vaultWarningThreshold: '5000',
};

export const creditSettings: SettingItem[] = [
  { description: 'Monto maximo que puede aprobar un analista sin revision.', id: 'approval-limit', label: 'Limite de analista', value: 'S/ 3,500' },
  { description: 'Tasa usada en calculo de interes continuo.', id: 'interest-rate', label: 'Tasa de interes', value: '12%' },
  { description: 'Tasa aplicada a cuotas vencidas.', id: 'penalty-rate', label: 'Mora diaria', value: '0.5%' },
  { description: 'Dias permitidos antes de marcar vencimiento.', id: 'grace-days', label: 'Dias de gracia', value: '2' },
];

export const cashSettings: SettingItem[] = [
  { description: 'Saldo maximo permitido al abrir o operar caja.', id: 'cash-max', label: 'Maximo efectivo caja', value: 'S/ 15,000' },
  { description: 'Diferencia maxima permitida entre efectivo esperado y contado.', id: 'cash-difference', label: 'Tolerancia cierre', value: 'S/ 0.50' },
  { description: 'Cierre obligatorio al finalizar operaciones.', id: 'daily-close', label: 'Cierre diario', value: 'Activo' },
];
