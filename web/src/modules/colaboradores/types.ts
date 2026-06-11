export type UserRole = 'ADMIN' | 'ANALYST' | 'CASHIER';

export interface UserItem {
  creditLimit: number;
  dni: string;
  email: string;
  fullName: string;
  id: string;
  isActive: boolean;
  phone: string | null;
  position: string | null;
  role: UserRole;
}

export interface UserFormState {
  creditLimit: string;
  dni: string;
  email: string;
  fullName: string;
  isActive: boolean;
  password: string;
  phone: string;
  position: string;
  role: UserRole;
}
