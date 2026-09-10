import { formatMoney } from '../../common/lib/format';
import type { DashboardCash, DashboardMetric, DashboardPortfolio, DashboardSummary } from './types';

export const getDashboardMetrics = (portfolio: DashboardPortfolio): DashboardMetric[] => [
  { id: 'portfolio', label: 'Cartera pendiente', value: formatMoney(portfolio.portfolioAmount), trend: `${portfolio.activeCreditCount} creditos vigentes` },
  { id: 'overdue', label: 'Saldo vencido', value: formatMoney(portfolio.overdueAmount), trend: `${portfolio.overdueRate.toFixed(1)}% de la cartera pendiente` },
  { id: 'collections', label: 'Cobrado hoy', value: formatMoney(portfolio.collectedToday), trend: 'Pagos recibidos en la cartera' },
  { id: 'due', label: 'Por cobrar hoy', value: formatMoney(portfolio.dueTodayAmount), trend: `${portfolio.dueTodayCount} cuotas con vencimiento hoy` },
];

export const getCashMetrics = (cash: DashboardCash): DashboardMetric[] => [
  { id: 'balance', label: 'Saldo en cajas abiertas', value: formatMoney(cash.sessions.reduce((total, session) => total + session.balance, 0)), trend: `${cash.sessions.length} cajas abiertas` },
  { id: 'income', label: 'Cobros de hoy', value: formatMoney(cash.collectedToday), trend: 'Ingresos por pagos de creditos' },
  { id: 'expenses', label: 'Desembolsos de hoy', value: formatMoney(cash.disbursedToday), trend: 'Egresos por entrega de creditos' },
];

export const getDashboardScopeLabel = (summary: DashboardSummary) => {
  if (summary.scope === 'ANALYST_PORTFOLIO') return 'Analista / Mi cartera';
  if (summary.scope === 'OWN_CASH') return 'Caja / Mis operaciones';
  return 'Administrador / Resumen general';
};

export const formatDashboardDate = (value: string) => new Date(value).toLocaleString('es-PE', {
  timeZone: 'America/Lima', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});

export const getApiErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(', ');
    return data.message ?? 'No se pudo completar la operacion';
  } catch {
    return 'No se pudo completar la operacion';
  }
};
