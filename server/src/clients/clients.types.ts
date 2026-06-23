import { ClientStatus } from '@prisma/client';

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email?: string;
  personalAddress?: string;
  businessAddress?: string;
  birthDate?: string;
  district?: string;
  province?: string;
  department?: string;
  occupation?: string;
  monthlyIncome?: number;
  isSpecial?: boolean;
  specialInterestRate?: number | null;
  status?: ClientStatus;
  notes?: string;
}

export interface UpdateClientInput extends CreateClientInput {}

export interface ClientListItem {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string | null;
  personalAddress: string | null;
  businessAddress: string | null;
  birthDate: string | null;
  activeCredits: number;
  isSpecial: boolean;
  specialInterestRate: number | null;
  totalDebt: number;
  status: ClientStatus;
}
