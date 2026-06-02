import { useCallback, useState } from 'react';
import type { Client } from '../clientes/types';
import type { CreditFormState, CreditSimulationResult } from './types';
import { getApiErrorMessage } from './lib';

const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';

export const useCreditClients = () => {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/clients`, { cache: 'no-store' });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return;
      }

      setClients((await response.json()) as Client[]);
    } catch {
      setError('No se pudo conectar con el backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { clients, error, fetchClients, isLoading };
};

export const useCreditRegistration = () => {
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulation, setSimulation] = useState<CreditSimulationResult | null>(null);

  const getPayload = (form: CreditFormState) => {
    return {
      amount: Number(form.amount),
      clientId: form.clientId,
      installments: Number(form.installments),
      notes: form.notes,
      productType: form.productType,
    };
  };

  const clearSimulation = useCallback(() => {
    setSimulation(null);
  }, []);

  const simulateCredit = useCallback(async (form: CreditFormState) => {
    setError(null);
    setIsSimulating(true);

    try {
      const response = await fetch(`${apiBaseUrl}/credits/simulate`, {
        body: JSON.stringify(getPayload(form)),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        setSimulation(null);
        return false;
      }

      setSimulation((await response.json()) as CreditSimulationResult);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      setSimulation(null);
      return false;
    } finally {
      setIsSimulating(false);
    }
  }, []);

  const registerCredit = useCallback(async (form: CreditFormState) => {
    setError(null);
    setIsRegistering(true);

    try {
      const response = await fetch(`${apiBaseUrl}/credits`, {
        body: JSON.stringify(getPayload(form)),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        setSimulation(null);
        return false;
      }

      setSimulation(null);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      setSimulation(null);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return { clearSimulation, error, isRegistering, isSimulating, registerCredit, simulateCredit, simulation };
};

export const useCreditPolicyParameters = () => {
  const [maxRequestFiles, setMaxRequestFiles] = useState(5);

  const fetchCreditPolicyParameters = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/parameters/credit-policy`, { cache: 'no-store' });

      if (!response.ok) return;

      const data = (await response.json()) as { maxRequestFiles?: number };
      setMaxRequestFiles(data.maxRequestFiles ?? 5);
    } catch {
      setMaxRequestFiles(5);
    }
  }, []);

  return { fetchCreditPolicyParameters, maxRequestFiles };
};
