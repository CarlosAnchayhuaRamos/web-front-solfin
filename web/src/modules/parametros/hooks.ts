import { useCallback, useEffect, useState } from 'react';
import { apiBaseUrl, apiFetch } from '../../common/api/client';
import { clonePenaltySettingsForm, initialCreditPolicyForm, penaltyFrequencyKeys } from './data';
import type { CashPolicy, CashPolicyFormState, CreditPolicy, CreditPolicyFormState, PenaltySettings, PenaltySettingsFormState } from './types';

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
    defaultInterestRate: toRateFormValue(policy.defaultInterestRate),
    defaultPenaltyRate: String(policy.defaultPenaltyRate * 100),
    graceDays: String(policy.graceDays),
    maxAnalystApprovalAmount: String(policy.maxAnalystApprovalAmount),
    maxInstallments: String(policy.maxInstallments),
    maxRequestFiles: String(policy.maxRequestFiles),
    penaltySettings: toPenaltySettingsFormState(policy.penaltySettings),
    requireApprovalAboveLimit: policy.requireApprovalAboveLimit,
    specialInterestRate: toRateFormValue(policy.specialInterestRate),
  };
};

export const toCreditPolicyInput = (form: CreditPolicyFormState): CreditPolicy => {
  return {
    defaultInterestRate: toRateInputValue(form.defaultInterestRate),
    defaultPenaltyRate: Number(form.penaltySettings.DAILY.rate) / 100,
    graceDays: Number(form.graceDays),
    maxAnalystApprovalAmount: Number(form.maxAnalystApprovalAmount),
    maxInstallments: Number(form.maxInstallments),
    maxRequestFiles: Number(form.maxRequestFiles),
    penaltySettings: toPenaltySettingsInput(form.penaltySettings),
    requireApprovalAboveLimit: form.requireApprovalAboveLimit,
    specialInterestRate: toRateInputValue(form.specialInterestRate),
  };
};

const toRateFormValue = (value: number) => {
  return String(Math.round(value * 100000) / 1000);
};

const toRateInputValue = (value: string) => {
  return Math.round(Number(value) * 1000) / 100000;
};

const toPenaltySettingsFormState = (settings: PenaltySettings): PenaltySettingsFormState => {
  const initialSettings = clonePenaltySettingsForm(initialCreditPolicyForm.penaltySettings);

  return penaltyFrequencyKeys.reduce((formSettings, frequency) => {
    const setting = settings[frequency];

    return {
      ...formSettings,
      [frequency]: {
        capRate: String(setting.capRate * 100),
        fixedDailyAmount: String(setting.fixedDailyAmount),
        graceDays: String(setting.graceDays),
        method: setting.method,
        rate: String(setting.rate * 100),
      },
    };
  }, initialSettings);
};

const toPenaltySettingsInput = (settings: PenaltySettingsFormState): PenaltySettings => {
  return penaltyFrequencyKeys.reduce((inputSettings, frequency) => {
    const setting = settings[frequency];

    return {
      ...inputSettings,
      [frequency]: {
        capRate: Number(setting.capRate) / 100,
        fixedDailyAmount: Number(setting.fixedDailyAmount),
        graceDays: Number(setting.graceDays),
        method: setting.method,
        rate: Number(setting.rate) / 100,
      },
    };
  }, {} as PenaltySettings);
};

export const toCashPolicyFormState = (policy: CashPolicy): CashPolicyFormState => {
  return {
    allowNegativeCash: policy.allowNegativeCash,
    maxCashDifference: String(policy.maxCashDifference),
    maxCashBoxBalance: String(policy.maxCashBoxBalance),
    requireDailyClosing: policy.requireDailyClosing,
    vaultWarningThreshold: String(policy.vaultWarningThreshold),
  };
};

export const toCashPolicyInput = (form: CashPolicyFormState): CashPolicy => {
  return {
    allowNegativeCash: form.allowNegativeCash,
    maxCashDifference: Number(form.maxCashDifference),
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
      const response = await apiFetch(`${apiBaseUrl}/parameters/credit-policy`, { cache: 'no-store' });

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
      const response = await apiFetch(`${apiBaseUrl}/parameters/credit-policy`, {
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
      const response = await apiFetch(`${apiBaseUrl}/parameters/cash-policy`, { cache: 'no-store' });

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
      const response = await apiFetch(`${apiBaseUrl}/parameters/cash-policy`, {
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
