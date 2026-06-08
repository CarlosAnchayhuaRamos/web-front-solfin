import { useCallback, useEffect, useState } from 'react';
import type { CashBox, CashDenominationCount, Cashier, CashSession, UnclosedCashBox } from './types';

const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';

const getApiErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };

    if (Array.isArray(data.message)) return data.message.join(', ');
    if (data.message) return data.message;
    return 'Error del backend';
  } catch {
    return 'Error del backend';
  }
};

export const useCashSessions = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [boxes, setBoxes] = useState<CashBox[] | null>(null);
  const [cashiers, setCashiers] = useState<Cashier[] | null>(null);
  const [sessions, setSessions] = useState<CashSession[] | null>(null);
  const [unclosedCashBoxes, setUnclosedCashBoxes] = useState<UnclosedCashBox[]>([]);

  const fetchSessions = useCallback(async () => {
    setError(null);
    setUnclosedCashBoxes([]);
    setIsLoading(true);

    try {
      const [sessionsResponse, vaultResponse, boxesResponse, cashiersResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/cash/sessions`, { cache: 'no-store' }),
        fetch(`${apiBaseUrl}/cash/vault/status`, { cache: 'no-store' }),
        fetch(`${apiBaseUrl}/cash/boxes`, { cache: 'no-store' }),
        fetch(`${apiBaseUrl}/cash/cashiers`, { cache: 'no-store' }),
      ]);

      if (!sessionsResponse.ok) {
        setError(await getApiErrorMessage(sessionsResponse));
        return false;
      }

      if (!vaultResponse.ok) {
        setError(await getApiErrorMessage(vaultResponse));
        return false;
      }

      if (!boxesResponse.ok) {
        setError(await getApiErrorMessage(boxesResponse));
        return false;
      }

      if (!cashiersResponse.ok) {
        setError(await getApiErrorMessage(cashiersResponse));
        return false;
      }

      const vault = (await vaultResponse.json()) as { isOpen: boolean };

      setIsVaultOpen(vault.isOpen);
      setBoxes((await boxesResponse.json()) as CashBox[]);
      setCashiers((await cashiersResponse.json()) as Cashier[]);
      setSessions((await sessionsResponse.json()) as CashSession[]);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openVault = useCallback(async () => {
    setError(null);
    setUnclosedCashBoxes([]);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/cash/vault/open`, { method: 'POST' });

      if (!response.ok) {
        const error = await getVaultToggleError(response);
        setError(error.message);
        setUnclosedCashBoxes(error.unclosedCashBoxes);
        return false;
      }

      setIsVaultOpen(true);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const closeVault = useCallback(async () => {
    setError(null);
    setUnclosedCashBoxes([]);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/cash/vault/close`, { method: 'POST' });

      if (!response.ok) {
        const error = await getVaultToggleError(response);
        setError(error.message);
        setUnclosedCashBoxes(error.unclosedCashBoxes);
        return false;
      }

      setIsVaultOpen(false);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const openCashSession = useCallback(async (
    cashBoxName: string,
    openingAmount: number,
    denominations: CashDenominationCount[],
    user: { fullName: string; id: string },
  ) => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/cash/sessions/open`, {
        body: JSON.stringify({ cashBoxName, cashierName: user.fullName, denominations, openingAmount, userId: user.id }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const session = (await response.json()) as CashSession;
      setSessions((currentSessions) => [session, ...(currentSessions ?? [])]);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const createCashBox = useCallback(async (name: string) => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/cash/boxes`, {
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const box = (await response.json()) as CashBox;
      setBoxes((currentBoxes) => [box, ...(currentBoxes ?? []).filter((currentBox) => currentBox.id !== box.id)]);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const assignCashBox = useCallback(async (boxId: string, cashierId: string) => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/cash/boxes/${boxId}/assign`, {
        body: JSON.stringify({ cashierId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const box = (await response.json()) as CashBox;
      setBoxes((currentBoxes) => (currentBoxes ?? []).map((currentBox) => (currentBox.id === box.id ? box : currentBox)));
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const closeCashSession = useCallback(async (sessionId: string, countedAmount: number, denominations: CashDenominationCount[]) => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/cash/sessions/${sessionId}/close`, {
        body: JSON.stringify({ countedAmount, denominations }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      const session = (await response.json()) as CashSession;
      setSessions((currentSessions) => (currentSessions ?? []).map((currentSession) => (currentSession.id === session.id ? session : currentSession)));
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  return {
    error,
    assignCashBox,
    boxes,
    cashiers,
    closeCashSession,
    closeVault,
    createCashBox,
    isLoading,
    isSaving,
    isVaultOpen,
    openCashSession,
    openVault,
    refetch: fetchSessions,
    sessions,
    unclosedCashBoxes,
  };
};

const getVaultToggleError = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[]; unclosedCashBoxes?: UnclosedCashBox[] };
    const message = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Error del backend';

    return {
      message,
      unclosedCashBoxes: data.unclosedCashBoxes ?? [],
    };
  } catch {
    return {
      message: 'Error del backend',
      unclosedCashBoxes: [],
    };
  }
};
