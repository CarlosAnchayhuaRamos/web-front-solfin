import { formatMoney } from '../../common/lib/format';
import type { DashboardMetric, DashboardSummary, WorkQueueItem } from './types';

export const getQueueColor = (item: WorkQueueItem) => {
  if (item.status === 'Urgente') return 'red';
  if (item.status === 'Pendiente') return 'yellow';
  return 'blue';
};

export const getDashboardMetrics = (summary: DashboardSummary): DashboardMetric[] => {
  return [
    {
      id: 'portfolio',
      label: 'Cartera vigente',
      trend: `${summary.activeCreditCount} creditos en gestion`,
      value: formatMoney(summary.portfolioAmount),
    },
    {
      id: 'overdue',
      label: 'Mora total',
      trend: `${summary.overdueCreditCount} creditos vencidos`,
      value: formatPercent(summary.overdueRate),
    },
    {
      id: 'collections',
      label: 'Cobrado hoy',
      trend: `Ticket promedio ${formatMoney(summary.averageTicket)}`,
      value: formatMoney(summary.collectedToday),
    },
    {
      id: 'requests',
      label: 'Solicitudes pendientes',
      trend: 'Requieren revision',
      value: String(summary.pendingApprovalCount),
    },
  ];
};

export const getApiErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(', ');
    return data.message ?? 'No se pudo completar la operacion';
  } catch {
    return 'No se pudo completar la operacion';
  }
};

export const getDashboardScopeLabel = (summary: DashboardSummary) => {
  if (summary.scope === 'ANALYST_PORTFOLIO') return 'Tu cartera asignada';
  return 'Vista general del negocio';
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};
