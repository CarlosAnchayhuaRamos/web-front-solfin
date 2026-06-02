// src/ui/components/sections/ServicesSection.tsx
import React from 'react';
import { CreditService } from '../../../domain/entities/CreditService';
import { SectionHeader } from '../common/SectionHeader';
import { AnimatedSection } from '../common/AnimatedSection';
import { theme } from '../../styles/theme';

interface Props {
  services: CreditService[];
  whatsappUrl: string;
}

export const ServicesSection: React.FC<Props> = ({ services, whatsappUrl }) => (
  <section id="servicios" style={{ padding: '88px 6% 100px', background: '#fff' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <AnimatedSection>
        <SectionHeader eyebrow="Lo que ofrecemos" title="Nuestros" highlight="Servicios" />
      </AnimatedSection>

      <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {services.map((service, i) => (
          <AnimatedSection key={service.id} delay={i * 0.09}>
            <div className="service-card">
              <div style={{ fontSize: '2.4rem', marginBottom: 14 }}>{service.icon}</div>
              <h3 style={{ fontFamily: theme.fonts.display, fontSize: '1.25rem', fontWeight: 700, color: theme.colors.dark, marginBottom: 10 }}>
                {service.title}
              </h3>
              <p style={{ color: theme.colors.textBody, lineHeight: 1.75, fontSize: '0.93rem' }}>
                {service.description}
              </p>
              <a href={`${whatsappUrl}?text=${encodeURIComponent(`Hola, me interesa un ${service.title}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 18, color: theme.colors.blue, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', borderBottom: `2px solid ${theme.colors.yellow}`, paddingBottom: 1 }}>
                {service.ctaLabel} →
              </a>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);
