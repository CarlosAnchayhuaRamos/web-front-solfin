// src/domain/ports/input/IContactUseCase.ts
// Input port (driving port) – defines what the application can do with contact info

import { ContactInfo } from '../../entities/ContactInfo';

export interface IContactUseCase {
  getContactInfo(): ContactInfo;
  getWhatsAppUrl(message?: string): string;
}
