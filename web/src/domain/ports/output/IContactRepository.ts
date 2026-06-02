// src/domain/ports/output/IContactRepository.ts
// Output port – defines how to retrieve contact info from a data source

import { ContactInfo } from '../../entities/ContactInfo';

export interface IContactRepository {
  getContactInfo(): ContactInfo;
}
