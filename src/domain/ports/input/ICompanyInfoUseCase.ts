// src/domain/ports/input/ICompanyInfoUseCase.ts
// Input port – defines how to retrieve company info for display

import { CompanyInfo } from '../../entities/CompanyInfo';

export interface ICompanyInfoUseCase {
  getCompanyInfo(): CompanyInfo;
}
