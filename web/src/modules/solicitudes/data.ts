import type { CreditStatusInfo } from './types';

export const approvalStatusMap: Record<string, CreditStatusInfo> = {
  APPROVED: { color: 'blue', label: 'Aprobado' },
  CANCELED: { color: 'gray', label: 'Cancelado' },
  PENDING: { color: 'yellow', label: 'Pendiente' },
  REJECTED: { color: 'red', label: 'Rechazado' },
};

export const initialApprovalFilters = {
  dateFrom: '',
  dateTo: '',
  status: 'PENDING',
} as const;

export const approvalStatusOptions = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
  { label: 'Canceladas', value: 'CANCELED' },
] as const;
