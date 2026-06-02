import type { ReportItem } from './types';

export const getReportActionLabel = (report: ReportItem) => {
  if (report.status === 'QUEUED') return 'En cola';
  return `Exportar ${report.format}`;
};
