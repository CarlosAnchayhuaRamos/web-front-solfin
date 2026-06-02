import type { ApprovalRequest, ApprovalRequestFilters } from './types';

export const getPendingRequests = (requests: ApprovalRequest[]) => {
  return requests.filter((request) => request.status === 'PENDING');
};

export const filterApprovalRequests = (requests: ApprovalRequest[], filters: ApprovalRequestFilters) => {
  return requests.filter((request) => {
    const requestedDate = request.requestedAt.slice(0, 10);
    const matchesStatus = filters.status === 'ALL' || request.status === filters.status;
    const matchesFrom = !filters.dateFrom || requestedDate >= filters.dateFrom;
    const matchesTo = !filters.dateTo || requestedDate <= filters.dateTo;

    return matchesStatus && matchesFrom && matchesTo;
  });
};

export const getApiErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };

    if (Array.isArray(payload.message)) return payload.message.join(', ');
    if (payload.message) return payload.message;
    return 'No se pudo completar la operacion';
  } catch {
    return 'No se pudo completar la operacion';
  }
};
