// src/domain/ports/output/ICreditServiceRepository.ts
// Output port (driven port) – defines how to retrieve credit services from a data source

import { CreditService } from '../../entities/CreditService';

export interface ICreditServiceRepository {
  findAll(): CreditService[];
  findById(id: string): CreditService | undefined;
}
