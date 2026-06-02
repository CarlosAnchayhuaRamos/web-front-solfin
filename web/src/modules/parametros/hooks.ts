import { useCallback, useEffect, useState } from 'react';
import type { CashPolicy, CashPolicyFormState, CreditPolicy, CreditPolicyFormState } from './types';

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

export const toCreditPolicyFormState = (policy: CreditPolicy): CreditPolicyFormState => {
  return {
    defaultInterestRate: String(Math.round(policy.defaultInterestRate * 1000) / 10),
    defaultPenaltyRate: String(policy.defaultPenaltyRate * 100),
    graceDays: String(policy.graceDays),
    maxAnalystApprovalAmount: String(policy.maxAnalystApprovalAmount),
    maxInstallments: String(policy.maxInstallments),
    maxRequestFiles: String(policy.maxRequestFiles),
    requireApprovalAboveLimit: policy.requireApprovalAboveLimit,
  };
};

export const toCreditPolicyInput = (form: CreditPolicyFormState): CreditPolicy => {
  return {
    defaultInterestRate: Math.round(Number(form.defaultInterestRate) * 10) / 1000,
    defaultPenaltyRate: Number(form.defaultPenaltyRate) / 100,
    graceDays: Number(form.graceDays),
    maxAnalystApprovalAmount: Number(form.maxAnalystApprovalAmount),
    maxInstallments: Number(form.maxInstallments),
    maxRequestFiles: Number(form.maxRequestFiles),
    requireApprovalAboveLimit: form.requireApprovalAboveLimit,
  };
};

export const toCashPolicyFormState = (policy: CashPolicy): CashPolicyFormState => {
  return {
    allowNegativeCash: policy.allowNegativeCash,
    maxCashBoxBalance: String(policy.maxCashBoxBalance),
    requireDailyClosing: policy.requireDailyClosing,
    vaultWarningThreshold: String(policy.vaultWarningThreshold),
  };
};

export const toCashPolicyInput = (form: CashPolicyFormState): CashPolicy => {
  return {
    allowNegativeCash: form.allowNegativeCash,
    maxCashBoxBalance: Number(form.maxCashBoxBalance),
    requireDailyClosing: form.requireDailyClosing,
    vaultWarningThreshold: Number(form.vaultWarningThreshold),
  };
};

export const useCreditPolicy = () => {
  const [creditPolicy, setCreditPolicy] = useState<CreditPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCreditPolicy = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/parameters/credit-policy`, { cache: 'no-store' });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      setCreditPolicy((await response.json()) as CreditPolicy);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCreditPolicy = useCallback(async (form: CreditPolicyFormState) => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/parameters/credit-policy`, {
        body: JSON.stringify(toCreditPolicyInput(form)),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      setCreditPolicy((await response.json()) as CreditPolicy);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    void fetchCreditPolicy();
  }, [fetchCreditPolicy]);

  return {
    creditPolicy,
    error,
    isLoading,
    isSaving,
    refetch: fetchCreditPolicy,
    updateCreditPolicy,
  };
};

export const useCashPolicy = () => {
  const [cashPolicy, setCashPolicy] = useState<CashPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCashPolicy = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/parameters/cash-policy`, { cache: 'no-store' });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      setCashPolicy((await response.json()) as CashPolicy);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCashPolicy = useCallback(async (form: CashPolicyFormState) => {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/parameters/cash-policy`, {
        body: JSON.stringify(toCashPolicyInput(form)),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response));
        return false;
      }

      setCashPolicy((await response.json()) as CashPolicy);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    void fetchCashPolicy();
  }, [fetchCashPolicy]);

  return {
    cashPolicy,
    error,
    isLoading,
    isSaving,
    refetch: fetchCashPolicy,
    updateCashPolicy,
  };
};
