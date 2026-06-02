import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, trend, value }) => {
  return (
    <article className="card stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__trend">{trend}</span>
    </article>
  );
};
