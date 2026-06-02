// src/domain/entities/ContactInfo.ts
// Domain entity representing company contact details

export interface BusinessHours {
  days: string;
  hours: string;
}

export interface ContactInfo {
  phone: string;
  whatsappUrl: string;
  address: string;
  addressDetail: string;
  city: string;
  country: string;
  mapEmbedUrl: string;
  businessHours: BusinessHours[];
}
