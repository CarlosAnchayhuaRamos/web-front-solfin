// src/ui/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../../styles/theme';

export const Footer: React.FC = () => (
  <footer style={{ background: theme.colors.dark, padding: '36px 6% 20px', color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
    <div style={{ fontFamily: theme.fonts.display, fontSize: '1.7rem', fontWeight: 700, marginBottom: 8 }}>
      <span style={{ color: theme.colors.yellow }}>SOL</span>
      <span style={{ color: '#1b4ea1' }}>FIN</span>
      {' '}
      <span style={{ color: theme.colors.red }}>PERÚ</span>
    </div>
    <p style={{ fontSize: '0.88rem', marginBottom: 4 }}>Solución Financiera del Perú</p>
    
    {/* Legal links */}
    <div style={{ marginBottom: 16, fontSize: '0.8rem' }}>
      <Link to="/politica-privacidad" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', marginRight: 16 }}>
        Política de Privacidad
      </Link>
      <Link to="/terminos-servicio" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', marginRight: 16 }}>
        Términos de Servicio
      </Link>
      <Link to="/eliminar-datos" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>
        Eliminar Datos
      </Link>
    </div>
    
    <p style={{ fontSize: '0.78rem' }}>© {new Date().getFullYear()} SOLFIN Perú. Todos los derechos reservados.</p>
  </footer>
);
