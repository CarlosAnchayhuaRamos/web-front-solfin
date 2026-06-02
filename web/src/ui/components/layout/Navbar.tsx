// src/ui/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { theme } from '../../styles/theme';
import { useScrolled } from '../../hooks/useScrolled';

interface Props {
  whatsappUrl: string;
}

const NAV_LINKS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'como-funciona', label: '¿Cómo funciona?' },
  { id: 'contacto', label: 'Contacto' },
];

export const Navbar: React.FC<Props> = ({ whatsappUrl }) => {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const scrollTo = (id: string) => {
    if (!isHome) {
      navigate('/');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setOpen(false);
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,22,40,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(252,241,46,0.12)' : 'none',
        transition: 'all 0.3s',
        padding: '0 6%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68,
      }}>
        {/* Logo */}
        <Link
          to="/"
          style={{ textDecoration: 'none' }}
          onClick={() => setOpen(false)}
        >
          <span style={{ fontFamily: theme.fonts.display, fontSize: '1.55rem', fontWeight: 700, letterSpacing: '0.03em', cursor: 'pointer' }}>
            <span style={{ color: theme.colors.yellow }}>SOL</span>
            <span style={{ color: '#1b4ea1'}}>FIN</span>
            {' '}
            <span style={{ color: theme.colors.red }}>PERÚ</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="desktop-nav">
          {NAV_LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#fff', fontFamily: theme.fonts.body,
                fontWeight: 600, fontSize: '0.85rem',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'color 0.2s', padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = theme.colors.yellow)}
              onMouseLeave={e => (e.currentTarget.style.color = '#fff')}
            >
              {label}
            </button>
          ))}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="btn-skew btn-primary"
            style={{ fontSize: '0.82rem', padding: '10px 22px' }}>
            Solicitar Crédito
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setOpen(!open)}
          style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.7rem', cursor: 'pointer' }}
          aria-label="Abrir menú"
        >
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99,
          background: 'rgba(10,22,40,0.98)', padding: '20px 6%',
          display: 'flex', flexDirection: 'column', gap: 20,
          borderBottom: `2px solid ${theme.colors.yellow}`,
        }}>
          {NAV_LINKS.map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background: 'none', border: 'none', color: '#fff', fontFamily: theme.fonts.body, fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', textAlign: 'left' }}>
              {label}
            </button>
          ))}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="btn-skew btn-primary" style={{ textAlign: 'center', padding: '12px 24px' }}>
            Solicitar Crédito
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </>
  );
};
