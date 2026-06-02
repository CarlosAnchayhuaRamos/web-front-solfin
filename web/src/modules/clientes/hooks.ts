import { useCallback, useEffect, useState } from 'react';
import type { Client, ClientCredit, CreateClientInput, PaymentVoucher, UpdateClientInput } from './types';
import { getApiErrorMessage } from './lib';

const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';

export const useClients = () => {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchClients = useCallback(async (options?: { silent?: boolean }) => {
    setError(null);

    if (options?.silent) {
      setIsRefreshing(true);
    }

    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      const response = await fetch(`${apiBaseUrl}/clients`, { cache: 'no-store' });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const data = (await response.json()) as Client[];
      setClients(data);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      if (options?.silent) {
        setIsRefreshing(false);
      }

      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, []);

  const createClient = useCallback(
    async (input: CreateClientInput) => {
      setError(null);
      setIsCreating(true);

      try {
        const response = await fetch(`${apiBaseUrl}/clients`, {
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        if (!response.ok) {
          setError(await getApiErrorMessage(response));
          return false;
        }

        await fetchClients({ silent: true });
        return true;
      } catch {
        setError('No se pudo conectar con el backend');
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [fetchClients],
  );

  const updateClient = useCallback(
    async (id: string, input: UpdateClientInput) => {
      setError(null);
      setIsUpdating(true);

      try {
        const response = await fetch(`${apiBaseUrl}/clients/${id}`, {
          body: JSON.stringify(input),
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        });

        if (!response.ok) {
          setError(await getApiErrorMessage(response));
          return false;
        }

        await fetchClients({ silent: true });
        return true;
      } catch {
        setError('No se pudo conectar con el backend');
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchClients],
  );

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  return {
    clients,
    createClient,
    error,
    isCreating,
    isLoading,
    isRefreshing,
    isUpdating,
    refetch: fetchClients,
    updateClient,
  };
};

export const useClientCredits = () => {
  const [credits, setCredits] = useState<ClientCredit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [voucher, setVoucher] = useState<PaymentVoucher | null>(null);

  const fetchCredits = useCallback(async (clientId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/credits/client/${clientId}/approved`, { cache: 'no-store' });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      setCredits((await response.json()) as ClientCredit[]);
      setVoucher(null);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const payInstallments = useCallback(
    async (creditId: string, scheduleIds: string[]) => {
      setError(null);
      setIsPaying(true);

      try {
        const response = await fetch(`${apiBaseUrl}/credits/${creditId}/pay-installments`, {
          body: JSON.stringify({ scheduleIds }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        if (!response.ok) {
          setError(await getApiErrorMessage(response));
          return false;
        }

        const data = (await response.json()) as { credits: ClientCredit[]; voucher: PaymentVoucher };
        setCredits(data.credits);
        setVoucher(data.voucher);
        return true;
      } catch {
        setError('No se pudo conectar con el backend');
        return false;
      } finally {
        setIsPaying(false);
      }
    },
    [],
  );

  return {
    credits,
    error,
    fetchCredits,
    isLoading,
    isPaying,
    payInstallments,
    voucher,
  };
};
