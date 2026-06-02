// src/infrastructure/repositories/StaticCompanyRepository.ts
// Driven adapter: provides company info from static in-memory data

import { CompanyInfo } from '../../domain/entities/CompanyInfo';
import { ICompanyRepository } from '../../domain/ports/output/ICompanyRepository';

const COMPANY_INFO: CompanyInfo = {
  name: 'SOLFIN Perú',
  tagline: 'Solución Financiera del Perú',
  heroTitle: 'Créditos Rápidos y Fáciles para Ti',
  heroSubtitle:
    'En SOLFIN Perú te damos acceso al crédito que necesitas, sin complicaciones. Aprobación ágil, atención personalizada y desembolso rápido.',
  stats: [
    { value: '100%', label: 'Compromiso' },
    { value: 'Ágil', label: 'Aprobación' },
    { value: '5', label: 'Tipos de Crédito' },
  ],
  valuePropositions: [
    {
      icon: '⚡',
      title: 'Aprobación Rápida',
      description: 'Sin largas esperas. Evaluamos tu solicitud en el menor tiempo posible.',
    },
    {
      icon: '📋',
      title: 'Trámites Sencillos',
      description: 'Pocos requisitos. Sin burocracia. Sin complicaciones innecesarias.',
    },
    {
      icon: '🤝',
      title: 'Atención Personalizada',
      description: 'Un asesor dedicado te guía en todo el proceso de principio a fin.',
    },
    {
      icon: '🔒',
      title: 'Total Confianza',
      description: 'Operamos con transparencia y seguridad en cada operación financiera.',
    },
  ],
  processSteps: [
    {
      number: '01',
      title: 'Contáctanos',
      description: 'Escríbenos por WhatsApp o llámanos. Te atendemos de inmediato.',
    },
    {
      number: '02',
      title: 'Evaluación',
      description: 'Revisamos tu perfil rápidamente, sin trámites complicados.',
    },
    {
      number: '03',
      title: 'Aprobación',
      description: 'Recibe respuesta en el menor tiempo posible.',
    },
    {
      number: '04',
      title: 'Desembolso',
      description: 'El dinero llega a ti de forma segura y directa.',
    },
  ],
};

export class StaticCompanyRepository implements ICompanyRepository {
  getCompanyInfo(): CompanyInfo {
    return COMPANY_INFO;
  }
}
