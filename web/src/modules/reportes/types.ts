export interface ReportItem {
  id: string;
  name: string;
  description: string;
  format: 'PDF' | 'XLSX' | 'CSV';
  status: 'READY' | 'QUEUED';
}
