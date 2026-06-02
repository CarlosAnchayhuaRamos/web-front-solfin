// src/ui/components/sections/WhyUsSection.tsx
import React from 'react';
import { ValueProposition } from '../../../domain/entities/CompanyInfo';
import { SectionHeader } from '../common/SectionHeader';
import { AnimatedSection } from '../common/AnimatedSection';
import { theme } from '../../styles/theme';

interface Props {
  valuePropositions: ValueProposition[];
}

export const WhyUsSection: React.FC<Props> = ({ valuePropositions }) => (
  <section style={{
    padding: '88px 6%',
    background: `linear-gradient(135deg, ${theme.colors.dark} 0%, ${theme.colors.darkBlue} 100%)`,
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, background: '#fff', clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 36 }}>
      <AnimatedSection>
        <SectionHeader title="¿Por qué elegir" highlight="SOLFIN Perú?" dark />
      </AnimatedSection>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        {valuePropositions.map((vp, i) => (
          <AnimatedSection key={vp.title} delay={i * 0.1}>
            <div style={{ textAlign: 'center', padding: '30px 18px' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 14 }}>{vp.icon}</div>
              <h3 style={{ fontFamily: theme.fonts.display, fontSize: '1.15rem', color: theme.colors.yellow, marginBottom: 8 }}>{vp.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, fontSize: '0.9rem' }}>{vp.description}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: '#f8f9fe', clipPath: 'polygon(0 100%, 100% 0%, 100% 100%)' }} />
  </section>
);
