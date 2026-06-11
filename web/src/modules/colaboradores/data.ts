import type { UserFormState, UserRole } from './types';

export const userRoleOptions: Array<{ label: string; value: UserRole }> = [
  { label: 'Administrador', value: 'ADMIN' },
  { label: 'Analista', value: 'ANALYST' },
  { label: 'Caja', value: 'CASHIER' },
];

export const initialUserForm: UserFormState = {
  creditLimit: '0',
  dni: '',
  email: '',
  fullName: '',
  isActive: true,
  password: '',
  phone: '',
  position: '',
  role: 'ANALYST',
};
