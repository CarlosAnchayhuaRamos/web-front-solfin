import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from './lib';
import type { ApprovalRequest } from './types';

const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';

export const useApprovalRequests = () => {
  const [requests, setRequests] = useState<ApprovalRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/approval-requests`, { cache: 'no-store' });

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
        const response = await fetch(`${apiBaseUrl}/approval-requests/${id}/${action}`, {
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        if (!response.ok) {
          setError(await getApiErrorMessage(response));
          return false;
        }

        await fetchRequests();
        return true;
      } catch {
        setError('No se pudo conectar con el backend');
        return false;
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
