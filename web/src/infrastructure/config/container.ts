// src/infrastructure/config/container.ts
// Dependency injection container – wires ports to adapters
// To swap from static data to an API, change the repository implementations here only

import { GetCreditServicesUseCase } from '../../application/usecases/GetCreditServicesUseCase';
import { GetContactInfoUseCase } from '../../application/usecases/GetContactInfoUseCase';
import { GetCompanyInfoUseCase } from '../../application/usecases/GetCompanyInfoUseCase';
import { StaticCreditServiceRepository } from '../repositories/StaticCreditServiceRepository';
import { StaticContactRepository } from '../repositories/StaticContactRepository';
import { StaticCompanyRepository } from '../repositories/StaticCompanyRepository';

// Repositories (driven adapters)
const creditServiceRepository = new StaticCreditServiceRepository();
const contactRepository = new StaticContactRepository();
const companyRepository = new StaticCompanyRepository();

// Use cases (application services wired to repositories via ports)
export const creditServiceUseCase = new GetCreditServicesUseCase(creditServiceRepository);
export const contactUseCase = new GetContactInfoUseCase(contactRepository);
export const companyInfoUseCase = new GetCompanyInfoUseCase(companyRepository);
