import { useCallback, useState } from 'react';
import { apiBaseUrl, apiFetch } from '../../common/api/client';
import type { Client } from '../clientes/types';
import type { CreditFormState, CreditSimulationResult, RegisteredCredit } from './types';
import { getApiErrorMessage, toRateInputValue } from './lib';

export const useCreditClients = () => {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiFetch(`${apiBaseUrl}/clients`, { cache: 'no-store' });

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
      fileNames: form.files.map((file) => file.name),
      installments: Number(form.installments),
      interestCalculationMethod: form.interestCalculationMethod,
      interestRate: form.interestRate.trim() ? toRateInputValue(form.interestRate) : undefined,
      notes: form.notes,
      paymentFrequency: form.paymentFrequency,
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
      const response = await apiFetch(`${apiBaseUrl}/credits/simulate`, {
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
      const response = await apiFetch(`${apiBaseUrl}/credits`, {
        body: JSON.stringify(getPayload(form)),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        setSimulation(null);
        return null;
      }

      const registeredCredit = (await response.json()) as RegisteredCredit;
      setSimulation(null);
      return registeredCredit;
    } catch {
      setError('No se pudo conectar con el backend');
      setSimulation(null);
      return null;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return { clearSimulation, error, isRegistering, isSimulating, registerCredit, simulateCredit, simulation };
};

export const useCreditPolicyParameters = () => {
  const [defaultInterestRate, setDefaultInterestRate] = useState(0.12);
  const [maxRequestFiles, setMaxRequestFiles] = useState(5);
  const [specialInterestRate, setSpecialInterestRate] = useState(0.1);

  const fetchCreditPolicyParameters = useCallback(async () => {
    try {
      const response = await apiFetch(`${apiBaseUrl}/parameters/credit-policy`, { cache: 'no-store' });

      if (!response.ok) return;

      const data = (await response.json()) as { defaultInterestRate?: number; maxRequestFiles?: number; specialInterestRate?: number };
      setDefaultInterestRate(data.defaultInterestRate ?? 0.12);
      setMaxRequestFiles(data.maxRequestFiles ?? 5);
      setSpecialInterestRate(data.specialInterestRate ?? 0.1);
    } catch {
      setDefaultInterestRate(0.12);
      setMaxRequestFiles(5);
      setSpecialInterestRate(0.1);
    }
  }, []);

  return { defaultInterestRate, fetchCreditPolicyParameters, maxRequestFiles, specialInterestRate };
};
