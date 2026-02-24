// src/domain/ports/output/ICompanyRepository.ts
// Output port – defines how to retrieve company info from a data source

import { CompanyInfo } from '../../entities/CompanyInfo';

export interface ICompanyRepository {
  getCompanyInfo(): CompanyInfo;
}
