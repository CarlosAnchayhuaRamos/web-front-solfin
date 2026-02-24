// src/ui/components/layout/FloatingWhatsApp.tsx
import React from 'react';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface Props { url: string; }

export const FloatingWhatsApp: React.FC<Props> = ({ url }) => (
  <a href={url} target="_blank" rel="noopener noreferrer"
    className="floating-wa" title="Contáctanos por WhatsApp" aria-label="Contactar por WhatsApp">
    <WhatsAppIcon size={30} color="#fff" />
  </a>
);
