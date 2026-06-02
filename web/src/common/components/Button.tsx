import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ className, variant = 'default', ...props }) => {
  return <button className={cn('button', `button--${variant}`, className)} type="button" {...props} />;
};
