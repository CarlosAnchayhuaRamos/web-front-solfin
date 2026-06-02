import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'yellow' | 'red' | 'gray' | 'black';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'gray' }) => {
  return <span className={cn('badge', `badge--${color}`)}>{children}</span>;
};
