import type { ClientFilters, ClientFormState, ClientStatus } from './types';

export const clientStatusOptions: Array<{ label: string; value: ClientStatus }> = [
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'Observado', value: 'WATCHLIST' },
  { label: 'Bloqueado', value: 'BLOCKED' },
  { label: 'Inactivo', value: 'INACTIVE' },
];

export const initialClientForm: ClientFormState = {
  dni: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  personalAddress: '',
  businessAddress: '',
  birthDate: '',
  status: 'ACTIVE',
};

export const initialClientFilters: ClientFilters = {
  dni: '',
  name: '',
};
