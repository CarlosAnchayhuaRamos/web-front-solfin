import type { CreditFormState, CreditProductOption } from './types';

export const creditProductOptions: CreditProductOption[] = [
  { defaultInstallments: 6, id: 'EXPRESS', label: 'Credito Express', maxAmount: 3000, requiresGuarantee: false },
  { defaultInstallments: 12, id: 'GARANTIA', label: 'Credito con Garantia', maxAmount: 10000, requiresGuarantee: true },
];

export const initialCreditForm: CreditFormState = {
  amount: '',
  clientId: '',
  clientSearch: '',
  files: [],
  installments: '6',
  notes: '',
  productType: 'EXPRESS',
};
