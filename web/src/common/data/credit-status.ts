import type { CreditStatusInfo } from '../../modules/solicitudes/types';

export const statusLabels = {
  BORRADOR: 'BORRADOR',
  PENDIENTE_APROBACION: 'PENDIENTE_APROBACION',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
  ACTIVO: 'ACTIVO',
  PAGADO: 'PAGADO',
  VENCIDO: 'VENCIDO',
  CASTIGADO: 'CASTIGADO',
  CANCELADO: 'CANCELADO',
} as const;

export const statusColors = {
  BORRADOR: 'gray',
  PENDIENTE_APROBACION: 'yellow',
  APROBADO: 'blue',
  RECHAZADO: 'red',
  ACTIVO: 'blue',
  PAGADO: 'black',
  VENCIDO: 'red',
  CASTIGADO: 'red',
  CANCELADO: 'gray',
} as const;

export const stateTransitions = {
  BORRADOR: ['PENDIENTE_APROBACION', 'CANCELADO'],
  PENDIENTE_APROBACION: ['APROBADO', 'RECHAZADO', 'CANCELADO'],
  APROBADO: ['ACTIVO', 'CANCELADO'],
  RECHAZADO: ['BORRADOR'],
  ACTIVO: ['PAGADO', 'VENCIDO', 'CASTIGADO'],
  PAGADO: [],
  VENCIDO: ['ACTIVO', 'PAGADO', 'CASTIGADO'],
  CASTIGADO: [],
  CANCELADO: [],
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
