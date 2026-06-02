// src/domain/entities/CreditService.ts
// Domain entity representing a credit product offered by SOLFIN Peru

export enum CreditType {
  PERSONAL = 'PERSONAL',
  EMPRESARIAL = 'EMPRESARIAL',
  VEHICULAR = 'VEHICULAR',
  HIPOTECARIO = 'HIPOTECARIO',
  PRENDARIO = 'PRENDARIO',
}

export interface CreditService {
  id: string;
  type: CreditType;
  title: string;
  description: string;
  icon: string;
  ctaLabel: string;
}
