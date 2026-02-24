// src/application/usecases/GetCompanyInfoUseCase.ts
// Retrieves branding and static company data

import { CompanyInfo } from '../../domain/entities/CompanyInfo';
import { ICompanyInfoUseCase } from '../../domain/ports/input/ICompanyInfoUseCase';
import { ICompanyRepository } from '../../domain/ports/output/ICompanyRepository';

export class GetCompanyInfoUseCase implements ICompanyInfoUseCase {
  constructor(private readonly repository: ICompanyRepository) {}

  getCompanyInfo(): CompanyInfo {
    return this.repository.getCompanyInfo();
  }
}
