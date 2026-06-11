import { useCallback, useEffect, useState } from 'react';
import { apiBaseUrl, apiFetch } from '../../common/api/client';
import type { Client, ClientCredit, CreateClientInput, CreditDisbursement, OpenCashSession, PaymentVoucher, UpdateClientInput } from './types';
import { getApiErrorMessage } from './lib';

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
      const response = await apiFetch(`${apiBaseUrl}/clients`, { cache: 'no-store' });

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
        const response = await apiFetch(`${apiBaseUrl}/clients`, {
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
        const response = await apiFetch(`${apiBaseUrl}/clients/${id}`, {
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
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [openCashSessions, setOpenCashSessions] = useState<OpenCashSession[] | null>(null);
  const [disbursement, setDisbursement] = useState<CreditDisbursement | null>(null);
  const [voucher, setVoucher] = useState<PaymentVoucher | null>(null);

  const fetchCredits = useCallback(async (clientId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const [response, sessionsResponse] = await Promise.all([
        apiFetch(`${apiBaseUrl}/credits/client/${clientId}/approved`, { cache: 'no-store' }),
        apiFetch(`${apiBaseUrl}/cash/sessions`, { cache: 'no-store' }),
      ]);

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      if (!sessionsResponse.ok) {
        setError(await getApiErrorMessage(sessionsResponse));
        return false;
      }

      setCredits((await response.json()) as ClientCredit[]);
      const sessions = (await sessionsResponse.json()) as OpenCashSession[];
      setOpenCashSessions(sessions.filter((session) => session.status === 'OPEN'));
      setDisbursement(null);
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
    async (creditId: string, amount: number, userId: string) => {
      setError(null);
      setIsPaying(true);

      try {
        const response = await apiFetch(`${apiBaseUrl}/credits/${creditId}/pay-installments`, {
          body: JSON.stringify({ amount, userId }),
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

  const disburseCredit = useCallback(async (creditId: string, userId: string) => {
    setError(null);
    setIsDisbursing(true);

    try {
      const response = await apiFetch(`${apiBaseUrl}/credits/${creditId}/disburse`, {
        body: JSON.stringify({ userId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const data = (await response.json()) as { credits: ClientCredit[]; disbursement: CreditDisbursement };
      setCredits(data.credits);
      setDisbursement(data.disbursement);
      setOpenCashSessions((currentSessions) =>
        (currentSessions ?? []).map((session) => {
          if (session.id !== data.disbursement.cashSessionId) return session;
          return { ...session, expectedAmount: session.expectedAmount - data.disbursement.amount };
        }),
      );
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsDisbursing(false);
    }
  }, []);

  return {
    credits,
    disbursement,
    disburseCredit,
    error,
    fetchCredits,
    isDisbursing,
    isLoading,
    isPaying,
    openCashSessions,
    payInstallments,
    voucher,
  };
};
