// src/ui/components/common/SectionHeader.tsx
import React from 'react';
import { theme } from '../../styles/theme';

interface Props {
  eyebrow?: string;
  title: string;
  highlight?: string;
  dark?: boolean;
}

export const SectionHeader: React.FC<Props> = ({ eyebrow, title, highlight, dark = false }) => (
  <div style={{ textAlign: 'center', marginBottom: 56 }}>
    {eyebrow && (
      <span style={{
        fontFamily: theme.fonts.display,
        color: theme.colors.red,
        letterSpacing: '0.15em',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}>
        {eyebrow}
      </span>
    )}
    <h2 style={{
      fontFamily: theme.fonts.display,
      fontSize: 'clamp(2rem, 4vw, 3rem)',
      fontWeight: 700,
      color: dark ? '#fff' : theme.colors.dark,
      marginTop: 8,
      lineHeight: 1.1,
    }}>
      {title}{' '}
      {highlight && <span style={{ color: dark ? theme.colors.yellow : theme.colors.blue }}>{highlight}</span>}
    </h2>
    <div style={{
      width: 60, height: 4,
      background: `linear-gradient(90deg, ${dark ? theme.colors.yellow : theme.colors.blue}, ${theme.colors.red})`,
      margin: '14px auto 0',
      borderRadius: 2,
    }} />
  </div>
);
