import { useCallback, useState } from 'react';
import { apiBaseUrl, apiFetch } from '../../common/api/client';
import { getApiErrorMessage } from './lib';
import type { PortfolioReport } from './types';

export const usePortfolioReport = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPortfolioReport = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiFetch(`${apiBaseUrl}/reports/portfolio`, { cache: 'no-store' });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return null;
      }

      return (await response.json()) as PortfolioReport;
    } catch {
      setError('No se pudo conectar con el backend');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    error,
    fetchPortfolioReport,
    isLoading,
  };
};
