// src/ui/components/sections/HeroSection.tsx
import React from 'react';
import { CompanyInfo } from '../../../domain/entities/CompanyInfo';
import { theme } from '../../styles/theme';

interface Props {
  company: CompanyInfo;
  whatsappUrl: string;
  onScrollToServices: () => void;
}

export const HeroSection: React.FC<Props> = ({ company, whatsappUrl, onScrollToServices }) => (
  <section id="inicio" style={{
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${theme.colors.dark} 0%, ${theme.colors.darkBlue} 45%, ${theme.colors.blue} 100%)`,
    display: 'flex', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
    padding: '100px 6% 80px',
  }}>
    {/* Background decorations */}
    <div style={{ position: 'absolute', bottom: -120, left: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(237,28,36,0.12), transparent)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: 80, right: '8%', width: 220, height: 220, border: '2px solid rgba(252,241,46,0.09)', borderRadius: '50%', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: 126, right: '11%', width: 130, height: 130, border: '2px solid rgba(252,241,46,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />

    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

        {/* Text */}
        <div>
          <div style={{
            display: 'inline-block', background: theme.colors.red, color: '#fff',
            fontFamily: theme.fonts.display, fontSize: '0.8rem', letterSpacing: '0.12em',
            padding: '5px 16px', marginBottom: 22, textTransform: 'uppercase',
          }}>
            {company.tagline}
          </div>
          <h1 style={{
            fontFamily: theme.fonts.display,
            fontSize: 'clamp(2.4rem, 5vw, 4.4rem)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.05,
            marginBottom: 22,
          }}>
            Créditos{' '}
            <span style={{ color: theme.colors.yellow }}>Rápidos</span>
            {' '}y{' '}
            <span style={{ color: theme.colors.yellow }}>Fáciles</span>
            {' '}para Ti
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: 34, maxWidth: 480 }}>
            {company.heroSubtitle}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="btn-skew btn-whatsapp">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.5L4 29l7.7-1.807A12.94 12.94 0 0016 28c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#fff"/>
                <path d="M12.5 11c-.3-.7-.6-.7-.9-.7-.23 0-.5 0-.76.003-.26.003-.68.1-1.04.5-.36.4-1.37 1.34-1.37 3.26 0 1.92 1.4 3.78 1.6 4.04.2.26 2.72 4.34 6.7 5.9 3.32 1.3 3.98 1.04 4.7.97.72-.07 2.3-.94 2.63-1.85.33-.91.33-1.69.23-1.85-.1-.16-.36-.26-.76-.46s-2.3-1.14-2.66-1.27c-.36-.13-.62-.2-.88.2-.26.4-.98 1.27-1.2 1.53-.22.26-.44.3-.84.1-.4-.2-1.68-.62-3.2-1.97-1.18-1.05-1.98-2.35-2.21-2.75-.23-.4-.02-.61.17-.81.18-.18.4-.47.6-.7.2-.23.26-.4.4-.66.13-.27.07-.5-.03-.7z" fill="#25D366"/>
              </svg>
              Hablar por WhatsApp
            </a>
            <button onClick={onScrollToServices} className="btn-skew btn-primary">
              Ver Servicios
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 36, marginTop: 44, flexWrap: 'wrap' }}>
            {company.stats.map(stat => (
              <div key={stat.label}>
                <div style={{ fontFamily: theme.fonts.display, fontSize: '2rem', fontWeight: 700, color: theme.colors.yellow }}>{stat.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Logo orb */}
        <div className="hero-logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            width: 300, height: 300, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '2px solid rgba(252,241,46,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 80px rgba(27,78,161,0.4)',
            position: 'relative',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: theme.fonts.display, fontSize: '3.2rem', fontWeight: 900, lineHeight: 1 }}>
  <span style={{ 
    color: theme.colors.yellow,
    textShadow: `
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000
    `
  }}>SOL</span>
  <span style={{ 
    color: '#1b4ea1',
    textShadow: `
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000
    `
  }}>FIN</span>
</div>
              <div style={{ fontFamily: theme.fonts.display, fontSize: '3.2rem', fontWeight: 900, color: theme.colors.red, lineHeight: 1 }}>PERÚ</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 10 }}>Solución Financiera Del Perú</div>
            </div>
            <div style={{ position: 'absolute', top: -12, right: -12, background: theme.colors.yellow, borderRadius: '50%', width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 20px rgba(252,241,46,0.4)' }}>💰</div>
            <div style={{ position: 'absolute', bottom: 4, left: -18, background: theme.colors.red, borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', boxShadow: '0 4px 20px rgba(237,28,36,0.4)' }}>🤝</div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom diagonal */}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: '#fff', clipPath: 'polygon(0 100%, 100% 0%, 100% 100%)' }} />
  </section>
);
