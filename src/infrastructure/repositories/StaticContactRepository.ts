// src/infrastructure/repositories/StaticContactRepository.ts
// Driven adapter: provides contact info from static in-memory data

import { ContactInfo } from '../../domain/entities/ContactInfo';
import { IContactRepository } from '../../domain/ports/output/IContactRepository';

const CONTACT_INFO: ContactInfo = {
  phone: '+51986366302',
  whatsappUrl: 'https://wa.me/51986366302',
  address: 'Asoc. Nery García Mzn. Ñ Lote 2',
  addressDetail: 'A 1 cuadra del Mercado Nery',
  city: 'Ayacucho',
  country: 'Perú',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d577.5381426448653!2d-74.23153173323261!3d-13.14990526490255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91127de4d7de86a7%3A0xda3fad9a3f99a565!2sMercado%20Nery%20Garcia%20Zarate!5e0!3m2!1sen!2spe!4v1771949520415!5m2!1sen!2spe',
  businessHours: [
    { days: 'Lunes a Viernes', hours: '8:00 am – 6:00 pm' },
    { days: 'Sábados', hours: '8:00 am – 1:00 pm' },
  ],
};

export class StaticContactRepository implements IContactRepository {
  getContactInfo(): ContactInfo {
    return CONTACT_INFO;
  }
}
