import type { CreditStatusInfo } from '../../modules/solicitudes/types';

export const statusLabels = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  ACTIVE: 'Activo',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  DEFAULTED: 'Castigado',
  CANCELED: 'Cancelado',
} as const;

export const statusColors = {
  DRAFT: 'gray',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'blue',
  REJECTED: 'red',
  ACTIVE: 'blue',
  PAID: 'black',
  OVERDUE: 'red',
  DEFAULTED: 'red',
  CANCELED: 'gray',
} as const;

export const stateTransitions = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELED'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELED'],
  APPROVED: ['ACTIVE', 'CANCELED'],
  REJECTED: ['DRAFT'],
  ACTIVE: ['PAID', 'OVERDUE', 'DEFAULTED'],
  PAID: [],
  OVERDUE: ['ACTIVE', 'PAID', 'DEFAULTED'],
  DEFAULTED: [],
  CANCELED: [],
} as const;

export const creditStatusMap: Record<string, CreditStatusInfo> = Object.keys(statusLabels).reduce(
  (accumulator, status) => {
    accumulator[status] = {
      color: statusColors[status as keyof typeof statusColors],
      label: statusLabels[status as keyof typeof statusLabels],
    };

    return accumulator;
  },
  {} as Record<string, CreditStatusInfo>,
);
