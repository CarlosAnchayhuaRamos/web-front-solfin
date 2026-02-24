// src/application/usecases/GetContactInfoUseCase.ts
// Handles contact info retrieval and WhatsApp URL generation

import { ContactInfo } from '../../domain/entities/ContactInfo';
import { IContactUseCase } from '../../domain/ports/input/IContactUseCase';
import { IContactRepository } from '../../domain/ports/output/IContactRepository';

export class GetContactInfoUseCase implements IContactUseCase {
  constructor(private readonly repository: IContactRepository) {}

  getContactInfo(): ContactInfo {
    return this.repository.getContactInfo();
  }

  getWhatsAppUrl(message?: string): string {
    const contact = this.repository.getContactInfo();
    const phoneClean = contact.phone.replace(/\D/g, '');
    const base = `https://wa.me/${phoneClean}`;
    if (message) {
      return `${base}?text=${encodeURIComponent(message)}`;
    }
    return base;
  }
}
