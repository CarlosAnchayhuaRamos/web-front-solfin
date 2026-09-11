import { useCallback, useEffect, useRef, useState } from 'react';
import { apiBaseUrl, apiFetch } from '../../common/api/client';
import type { Client, ClientCredit, CreateClientInput, CreditAdvisor, CreditDisbursement, CreditDocumentChecklist, CreditDocumentType, OpenCashSession, PaymentVoucher, UpdateClientInput } from './types';
import { getApiErrorMessage, toClientPayload } from './lib';
import type { PendingPaymentRequest } from './types';
import type { ClientFilters, ClientPage } from './types';
import { initialClientFilters } from './data';
import type { CreditReversalRequest, ReversalVoucher } from './types';

export const useClients = () => {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ClientFilters>(initialClientFilters);
  const requestVersion = useRef(0);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchClients = useCallback(async (options?: { silent?: boolean }) => {
    const version = ++requestVersion.current;
    setError(null);

    if (options?.silent) {
      setIsRefreshing(true);
    }

    if (!options?.silent) {
      setIsLoading(true);
    }

    try {
      const query = new URLSearchParams({ page: String(page), name: filters.name, dni: filters.dni });
      const response = await apiFetch(`${apiBaseUrl}/clients/page?${query}`, { cache: 'no-store' });
      if (version !== requestVersion.current) return false;

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const data = (await response.json()) as ClientPage;
      if (version !== requestVersion.current) return false;
      setClients(data.items);
      setTotal(data.total);
      return true;
    } catch {
      if (version !== requestVersion.current) return false;
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      if (version === requestVersion.current && options?.silent) {
        setIsRefreshing(false);
      }

      if (version === requestVersion.current) {
        setIsLoading(false);
      }
    }
  }, [page, filters]);

  const createClient = useCallback(
    async (input: CreateClientInput) => {
      setError(null);
      setIsCreating(true);

      try {
        const response = await apiFetch(`${apiBaseUrl}/clients`, {
          body: JSON.stringify(toClientPayload(input)),
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
          body: JSON.stringify(toClientPayload(input)),
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
    const timer = setTimeout(() => void fetchClients({ silent: true }), 250);
    return () => { clearTimeout(timer); requestVersion.current += 1; };
  }, [fetchClients]);

  return {
    page, setPage, total, filters, setFilters,
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

export const useClientCredits = (canAssignAdvisor: boolean, canUseCashSessions: boolean) => {
  const reversalInFlight = useRef(false);
  const [isReversing, setIsReversing] = useState(false);
  const [reversalVoucher, setReversalVoucher] = useState<ReversalVoucher | null>(null);
  const paymentInFlight = useRef(false);
  const [advisors, setAdvisors] = useState<CreditAdvisor[] | null>(null);
  const [credits, setCredits] = useState<ClientCredit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [isAssigningAdvisor, setIsAssigningAdvisor] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [openCashSessions, setOpenCashSessions] = useState<OpenCashSession[] | null>(null);
  const [disbursement, setDisbursement] = useState<CreditDisbursement | null>(null);
  const [voucher, setVoucher] = useState<PaymentVoucher | null>(null);

  const prepareDocuments = useCallback(async (creditId: string): Promise<ClientCredit | null> => {
    setError(null);
    try {
      const response = await apiFetch(`${apiBaseUrl}/credits/${creditId}/prepare-documents`, { method: 'POST' });
      if (!response.ok) { setError(await getApiErrorMessage(response)); return null; }
      const data = await response.json() as ClientCredit[];
      setCredits(data);
      return data.find((credit) => credit.id === creditId) ?? null;
    } catch { setError('No se pudieron preparar los documentos'); return null; }
  }, []);

  const confirmDocument = useCallback(async (creditId: string, type: CreditDocumentType, date: string) => {
    try {
      const response = await apiFetch(`${apiBaseUrl}/credits/${creditId}/confirm-document`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, date }),
      });
      if (!response.ok) { setError(await getApiErrorMessage(response)); return false; }
      const generatedDocuments = await response.json() as CreditDocumentChecklist;
      setCredits((current) => current?.map((credit) => credit.id === creditId ? { ...credit, generatedDocuments } : credit) ?? null);
      return true;
    } catch { setError('No se pudo registrar la generacion del documento'); return false; }
  }, []);

  const fetchCredits = useCallback(async (clientId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const [response, sessionsResponse, advisorsResponse] = await Promise.all([
        apiFetch(`${apiBaseUrl}/credits/client/${clientId}/approved`, { cache: 'no-store' }),
        canUseCashSessions ? apiFetch(`${apiBaseUrl}/cash/sessions`, { cache: 'no-store' }) : Promise.resolve(null),
        canAssignAdvisor ? apiFetch(`${apiBaseUrl}/credits/advisors`, { cache: 'no-store' }) : Promise.resolve(null),
      ]);

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      if (sessionsResponse && !sessionsResponse.ok) {
        setError(await getApiErrorMessage(sessionsResponse));
        return false;
      }

      if (advisorsResponse && !advisorsResponse.ok) {
        setError(await getApiErrorMessage(advisorsResponse));
        return false;
      }

      setCredits((await response.json()) as ClientCredit[]);
      const sessions = sessionsResponse ? ((await sessionsResponse.json()) as OpenCashSession[]) : [];
      setOpenCashSessions(sessions.filter((session) => session.status === 'OPEN'));
      setAdvisors(advisorsResponse ? ((await advisorsResponse.json()) as CreditAdvisor[]) : null);
      setDisbursement(null);
      setVoucher(null);
      setReversalVoucher(null);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [canAssignAdvisor, canUseCashSessions]);

  const assignAdvisor = useCallback(async (creditId: string, advisorId: string) => {
    setError(null);
    setIsAssigningAdvisor(true);

    try {
      const response = await apiFetch(`${apiBaseUrl}/credits/${creditId}/advisor`, {
        body: JSON.stringify({ advisorId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const assignedAdvisor = (await response.json()) as Pick<ClientCredit, 'advisorId' | 'advisorName'>;
      setCredits((currentCredits) => {
        if (!currentCredits) return currentCredits;
        return currentCredits.map((credit) => {
          if (credit.id !== creditId) return credit;
          return { ...credit, ...assignedAdvisor };
        });
      });
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsAssigningAdvisor(false);
    }
  }, []);

  const payInstallments = useCallback(
    async (creditId: string, amount: number, userId: string) => {
      if (paymentInFlight.current) return false;
      paymentInFlight.current = true;
      setError(null);
      setIsPaying(true);

      try {
        const storageKey = `solfin-payment:${userId}:${creditId}`;
        const saved = sessionStorage.getItem(storageKey);
        const pending = saved ? JSON.parse(saved) as PendingPaymentRequest : { amount, requestId: crypto.randomUUID() };
        if (pending.amount !== amount) {
          setError(`Hay un pago de S/ ${pending.amount.toFixed(2)} sin confirmar. Reintente ese monto antes de registrar otro.`);
          return false;
        }
        sessionStorage.setItem(storageKey, JSON.stringify(pending));
        const response = await apiFetch(`${apiBaseUrl}/credits/${creditId}/pay-installments`, {
          body: JSON.stringify({ amount, requestId: pending.requestId }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        if (!response.ok) {
          if ([400, 401, 403, 404, 409].includes(response.status)) sessionStorage.removeItem(storageKey);
          setError(await getApiErrorMessage(response));
          return false;
        }

        const data = (await response.json()) as { credits: ClientCredit[]; voucher: PaymentVoucher };
        sessionStorage.removeItem(storageKey);
        setCredits(data.credits);
        setVoucher(data.voucher);
        return data.voucher;
      } catch {
        setError('No se pudo conectar con el backend');
        return false;
      } finally {
        paymentInFlight.current = false;
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

  const reverseCredit = useCallback(async (creditId: string, input: CreditReversalRequest) => {
    if (reversalInFlight.current) return false;
    reversalInFlight.current = true;
    setIsReversing(true);
    setError(null);
    try {
      const response = await apiFetch(`${apiBaseUrl}/credits/${creditId}/reverse`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      });
      if (!response.ok) { setError(await getApiErrorMessage(response)); return false; }
      const data = await response.json() as { credits: ClientCredit[]; voucher: ReversalVoucher };
      setCredits(data.credits);
      setReversalVoucher(data.voucher);
      setVoucher(null);
      setDisbursement(null);
      const sessions = await apiFetch(`${apiBaseUrl}/cash/sessions`, { cache: 'no-store' });
      if (sessions.ok) setOpenCashSessions((await sessions.json() as OpenCashSession[]).filter((s) => s.status === 'OPEN'));
      return true;
    } catch { setError('No se pudo confirmar la reversion. Reintente la misma operacion.'); return false; }
    finally { reversalInFlight.current = false; setIsReversing(false); }
  }, []);

  return {
    reverseCredit, isReversing, reversalVoucher,
    advisors,
    assignAdvisor,
    credits,
    disbursement,
    disburseCredit,
    error,
    fetchCredits,
    isDisbursing,
    isAssigningAdvisor,
    isLoading,
    isPaying,
    openCashSessions,
    payInstallments,
    prepareDocuments,
    confirmDocument,
    voucher,
  };
};
