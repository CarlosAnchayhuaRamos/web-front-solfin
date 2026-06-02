import type { WorkQueueItem } from './types';

export const getQueueColor = (item: WorkQueueItem) => {
  if (item.status === 'Urgente') return 'red';
  if (item.status === 'Pendiente') return 'yellow';
  return 'blue';
};
