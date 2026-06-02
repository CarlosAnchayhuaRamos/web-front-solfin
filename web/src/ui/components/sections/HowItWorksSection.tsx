// src/ui/components/sections/HowItWorksSection.tsx
import React from 'react';
import { ProcessStep } from '../../../domain/entities/CompanyInfo';
import { SectionHeader } from '../common/SectionHeader';
import { AnimatedSection } from '../common/AnimatedSection';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { theme } from '../../styles/theme';

interface Props {
  steps: ProcessStep[];
  whatsappUrl: string;
}

const ACCENT_COLORS = [theme.colors.blue, theme.colors.red, theme.colors.blue, theme.colors.red];

export const HowItWorksSection: React.FC<Props> = ({ steps, whatsappUrl }) => (
  <section id="como-funciona" style={{ padding: '100px 6%', background: '#f8f9fe' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <AnimatedSection>
        <SectionHeader eyebrow="Simple y rápido" title="¿Cómo" highlight="Funciona?" />
      </AnimatedSection>

      <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
        {steps.map((step, i) => (
          <AnimatedSection key={step.number} delay={i * 0.11}>
            <div style={{
              background: '#fff',
              padding: '30px 22px',
              borderBottom: `4px solid ${ACCENT_COLORS[i]}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontFamily: theme.fonts.display, fontSize: '3.8rem', fontWeight: 700, color: theme.colors.yellow, lineHeight: 1, textShadow: '2px 2px 0 rgba(0,0,0,0.15)' }}>
                {step.number}
              </div>
              <h3 style={{ fontFamily: theme.fonts.display, fontSize: '1.15rem', fontWeight: 700, color: theme.colors.dark, marginTop: 10, marginBottom: 8 }}>
                {step.title}
              </h3>
              <p style={{ color: '#666', lineHeight: 1.7, fontSize: '0.9rem' }}>{step.description}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.45}>
        <div style={{ textAlign: 'center', marginTop: 44 }}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="btn-skew btn-whatsapp" style={{ fontSize: '1.05rem', padding: '15px 38px' }}>
            <WhatsAppIcon size={22} />
            ¡Empieza Ahora — Es Gratis Consultar!
          </a>
        </div>
      </AnimatedSection>
    </div>
  </section>
);
