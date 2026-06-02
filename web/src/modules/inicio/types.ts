export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
}

export interface WorkQueueItem {
  id: string;
  title: string;
  description: string;
  status: 'Urgente' | 'Pendiente' | 'Normal';
}
