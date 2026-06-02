// src/domain/ports/input/ICreditServiceUseCase.ts
// Input port (driving port) – defines what the application can do with credit services

import { CreditService } from '../../entities/CreditService';

export interface ICreditServiceUseCase {
  getAllCreditServices(): CreditService[];
  getCreditServiceById(id: string): CreditService | undefined;
}
