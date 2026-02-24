// src/ui/hooks/useContact.ts
import { useMemo } from 'react';
import { ContactInfo } from '../../domain/entities/ContactInfo';
import { IContactUseCase } from '../../domain/ports/input/IContactUseCase';

interface UseContactReturn {
  contactInfo: ContactInfo;
  getWhatsAppUrl: (message?: string) => string;
}

export function useContact(useCase: IContactUseCase): UseContactReturn {
  const contactInfo = useMemo(() => useCase.getContactInfo(), [useCase]);
  const getWhatsAppUrl = useMemo(
    () => (message?: string) => useCase.getWhatsAppUrl(message),
    [useCase]
  );
  return { contactInfo, getWhatsAppUrl };
}
