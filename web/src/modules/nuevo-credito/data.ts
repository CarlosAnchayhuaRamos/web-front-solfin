import type { CreditFormState, CreditProductOption, InterestCalculationMethod, PaymentFrequency } from './types';

export const creditProductOptions: CreditProductOption[] = [
  { defaultInstallments: 6, id: 'EXPRESS', label: 'Credito Express', maxAmount: 3000, requiresGuarantee: false },
  { defaultInstallments: 12, id: 'GARANTIA', label: 'Credito con Garantia', maxAmount: 10000, requiresGuarantee: true },
];

export const paymentFrequencyOptions: Array<{ id: PaymentFrequency; label: string }> = [
  { id: 'MONTHLY', label: 'Mensual' },
  { id: 'WEEKLY', label: 'Semanal' },
  { id: 'DAILY', label: 'Diario' },
];

export const interestCalculationMethodOptions: Array<{ id: InterestCalculationMethod; label: string }> = [
  { id: 'CONTINUOUS', label: 'Continuo' },
  { id: 'EQUAL_INSTALLMENTS', label: 'Cuotas iguales' },
];

export const initialCreditForm: CreditFormState = {
  amount: '',
  clientId: '',
  clientSearch: '',
  files: [],
  installments: '6',
  interestCalculationMethod: 'CONTINUOUS',
  interestRate: '',
  notes: '',
  paymentFrequency: 'MONTHLY',
  productType: 'EXPRESS',
};
