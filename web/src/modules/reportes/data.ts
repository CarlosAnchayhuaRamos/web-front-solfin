import type { ReportItem } from './types';

export const reports: ReportItem[] = [
  { description: 'Cartera activa, pagada, vencida y castigada.', format: 'XLSX', id: 'REP-001', name: 'Cartera de creditos', status: 'READY' },
  { description: 'Resumen de mora por cliente, analista y fecha.', format: 'PDF', id: 'REP-002', name: 'Mora y cobranza', status: 'READY' },
  { description: 'Movimientos, apertura, cierre y diferencias.', format: 'CSV', id: 'REP-003', name: 'Cierre de caja', status: 'QUEUED' },
];
