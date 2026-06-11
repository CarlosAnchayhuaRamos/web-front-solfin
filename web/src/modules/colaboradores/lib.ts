import type { UserFormState, UserItem, UserRole } from './types';

export const getUserRoleLabel = (role: UserRole) => {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'CASHIER') return 'Caja';
  return 'Analista';
};

export const toUserFormState = (user: UserItem): UserFormState => ({
  creditLimit: String(user.creditLimit),
  dni: user.dni,
  email: user.email,
  fullName: user.fullName,
  isActive: user.isActive,
  password: '',
  phone: user.phone ?? '',
  position: user.position ?? '',
  role: user.role,
});
