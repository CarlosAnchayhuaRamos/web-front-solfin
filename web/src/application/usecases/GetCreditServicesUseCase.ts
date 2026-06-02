// src/application/usecases/GetCreditServicesUseCase.ts
// Orchestrates the retrieval of credit services – pure business logic

import { CreditService } from '../../domain/entities/CreditService';
import { ICreditServiceUseCase } from '../../domain/ports/input/ICreditServiceUseCase';
import { ICreditServiceRepository } from '../../domain/ports/output/ICreditServiceRepository';

export class GetCreditServicesUseCase implements ICreditServiceUseCase {
  constructor(private readonly repository: ICreditServiceRepository) {}

  getAllCreditServices(): CreditService[] {
    return this.repository.findAll();
  }

  getCreditServiceById(id: string): CreditService | undefined {
    return this.repository.findById(id);
  }
}
