import type { ReportItem } from './types';

export const reports: ReportItem[] = [
  { description: 'Registro imprimible de cartera asignada, mora y volumen.', format: 'PDF', id: 'REP-001', name: 'Cartera asignada', status: 'READY' },
  { description: 'Resumen de mora por cliente, analista y fecha.', format: 'PDF', id: 'REP-002', name: 'Mora y cobranza', status: 'READY' },
  { description: 'Movimientos, apertura, cierre y diferencias.', format: 'CSV', id: 'REP-003', name: 'Cierre de caja', status: 'QUEUED' },
];
