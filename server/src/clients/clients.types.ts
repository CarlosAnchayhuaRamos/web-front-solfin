import { ClientStatus } from '@prisma/client';

export interface CreateClientInput {
  personalAddressReference?: string;
  businessAddressReference?: string;
  referenceName?: string;
  referencePhone?: string;
  businessRuc?: string;
  businessName?: string;
  businessPhone?: string;
  businessActivity?: string;
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
  personalAddressReference: string | null;
  businessAddressReference: string | null;
  referenceName: string | null;
  referencePhone: string | null;
  businessRuc: string | null;
  businessName: string | null;
  businessPhone: string | null;
  businessActivity: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
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
