import type { DashboardMetric, WorkQueueItem } from './types';

export const dashboardMetrics: DashboardMetric[] = [
  { id: 'portfolio', label: 'Cartera activa', trend: '128 creditos vigentes', value: 'S/ 184,250' },
  { id: 'risk', label: 'Mora total', trend: '9 creditos vencidos', value: '6.8%' },
  { id: 'cash', label: 'Caja del dia', trend: 'Ultimo cierre correcto', value: 'S/ 12,480' },
  { id: 'requests', label: 'Solicitudes', trend: 'Requieren aprobacion', value: '3' },
];

export const workQueue: WorkQueueItem[] = [
  { description: 'Credito Garantia por S/ 5,200', id: 'T-001', status: 'Urgente', title: 'Aprobar solicitud' },
  { description: 'Caja principal pendiente de cierre', id: 'T-002', status: 'Pendiente', title: 'Cierre diario' },
  { description: 'Contrato y DNI por verificar', id: 'T-003', status: 'Normal', title: 'Documentos nuevos' },
];
