// src/infrastructure/repositories/StaticCreditServiceRepository.ts
// Driven adapter: provides credit services from static in-memory data
// Can be replaced by an API adapter without touching domain or application layers

import { CreditService, CreditType } from '../../domain/entities/CreditService';
import { ICreditServiceRepository } from '../../domain/ports/output/ICreditServiceRepository';

const CREDIT_SERVICES: CreditService[] = [
  {
    id: 'personal',
    type: CreditType.PERSONAL,
    title: 'Créditos Personales',
    description:
      'Obtén el dinero que necesitas para tus metas personales con cuotas accesibles y aprobación rápida. Sin trámites complicados.',
    icon: '👤',
    ctaLabel: 'Solicitar ahora',
  },
  {
    id: 'empresarial',
    type: CreditType.EMPRESARIAL,
    title: 'Créditos Empresariales',
    description:
      'Impulsa tu negocio con financiamiento ágil diseñado para emprendedores y empresas en crecimiento.',
    icon: '🏢',
    ctaLabel: 'Solicitar ahora',
  },
  {
    id: 'vehicular',
    type: CreditType.VEHICULAR,
    title: 'Créditos Vehiculares',
    description:
      'Consigue el vehículo que necesitas con tasas competitivas y trámites simplificados al máximo.',
    icon: '🚗',
    ctaLabel: 'Solicitar ahora',
  },
  {
    id: 'hipotecario',
    type: CreditType.HIPOTECARIO,
    title: 'Créditos Hipotecarios',
    description:
      'Haz realidad el sueño de tu casa propia con planes flexibles adaptados a tu situación económica.',
    icon: '🏠',
    ctaLabel: 'Solicitar ahora',
  },
  {
    id: 'prendario',
    type: CreditType.PRENDARIO,
    title: 'Créditos Prendarios',
    description:
      'Obtén liquidez inmediata usando tus bienes como garantía, con total seguridad y confianza.',
    icon: '💍',
    ctaLabel: 'Solicitar ahora',
  },
];

export class StaticCreditServiceRepository implements ICreditServiceRepository {
  findAll(): CreditService[] {
    return CREDIT_SERVICES;
  }

  findById(id: string): CreditService | undefined {
    return CREDIT_SERVICES.find((s) => s.id === id);
  }
}
