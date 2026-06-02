import React from 'react';
import { cn } from '../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children }) => {
  return <section className="card">{children}</section>;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ action, description, title }) => {
  return (
    <div className="card__header">
      <div>
        <h2 className="card__title">{title}</h2>
        {description ? <p className="card__description">{description}</p> : null}
      </div>
      {action}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className }) => {
  return <div className={cn('card__body', className)}>{children}</div>;
};
