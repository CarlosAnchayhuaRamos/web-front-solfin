import { UserRole } from '@prisma/client';

export interface CreateUserInput {
  creditLimit?: number;
  dni: string;
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  position?: string;
  role: UserRole;
}

export interface UpdateUserInput {
  creditLimit?: number;
  dni: string;
  email: string;
  fullName: string;
  isActive: boolean;
  password?: string;
  phone?: string;
  position?: string;
  role: UserRole;
}
