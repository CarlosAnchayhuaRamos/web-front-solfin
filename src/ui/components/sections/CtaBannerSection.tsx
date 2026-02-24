// src/ui/components/sections/CtaBannerSection.tsx
import React from 'react';
import { theme } from '../../styles/theme';

interface Props { whatsappUrl: string; }

export const CtaBannerSection: React.FC<Props> = ({ whatsappUrl }) => (
  <section style={{
    padding: '60px 6%',
    background: `linear-gradient(135deg, ${theme.colors.blue} 0%, ${theme.colors.darkBlue} 100%)`,
    textAlign: 'center',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: '35%', height: '100%', background: 'rgba(252,241,46,0.04)', clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0 100%)', pointerEvents: 'none' }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <h2 style={{ fontFamily: theme.fonts.display, fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>
        ¿Listo para obtener tu crédito?
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem', marginBottom: 26 }}>
        Contáctanos hoy mismo. Sin costo y sin compromiso.
      </p>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
        className="btn-skew btn-primary" style={{ fontSize: '1.05rem', padding: '15px 42px' }}>
        Solicitar Crédito Ahora →
      </a>
    </div>
  </section>
);
