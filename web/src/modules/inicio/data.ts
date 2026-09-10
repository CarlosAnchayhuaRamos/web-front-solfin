import type { DashboardAction } from './types';

export const dashboardActions: DashboardAction[] = [
  { path: '/nuevo-credito', label: 'Nuevo credito', roles: ['ADMIN', 'ANALYST'] },
  { path: '/clientes', label: 'Clientes y pagos', roles: ['ADMIN', 'ANALYST', 'CASHIER'] },
  { path: '/solicitudes', label: 'Revisar solicitudes', roles: ['ADMIN'] },
  { path: '/apertura-cierre', label: 'Apertura y cierre', roles: ['ADMIN', 'CASHIER'] },
  { path: '/reportes', label: 'Reportes', roles: ['ADMIN', 'ANALYST'] },
];
