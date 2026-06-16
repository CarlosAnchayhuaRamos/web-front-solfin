import { useCallback, useEffect, useState } from 'react';
import { apiBaseUrl, apiFetch } from '../../common/api/client';
import { getApiErrorMessage } from './lib';
import type { ApprovalRequest, ReviewApprovalResult } from './types';

export const useApprovalRequests = () => {
  const [requests, setRequests] = useState<ApprovalRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiFetch(`${apiBaseUrl}/approval-requests`, { cache: 'no-store' });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return;
      }

      setRequests((await response.json()) as ApprovalRequest[]);
    } catch {
      setError('No se pudo conectar con el backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reviewRequest = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      setError(null);
      setReviewingId(id);

      try {
        const response = await apiFetch(`${apiBaseUrl}/approval-requests/${id}/${action}`, {
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        if (!response.ok) {
          setError(await getApiErrorMessage(response));
          return null;
        }

        const result = (await response.json()) as ReviewApprovalResult;
        await fetchRequests();
        return result.contract;
      } catch {
        setError('No se pudo conectar con el backend');
        return null;
      } finally {
        setReviewingId(null);
      }
    },
    [fetchRequests],
  );

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  return {
    error,
    isLoading,
    refetch: fetchRequests,
    requests,
    reviewRequest,
    reviewingId,
  };
};
