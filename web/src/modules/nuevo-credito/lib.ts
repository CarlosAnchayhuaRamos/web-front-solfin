import type { CreditProductOption } from './types';
import type { Client } from '../clientes/types';

export const getProductDescription = (product: CreditProductOption) => {
  if (product.requiresGuarantee) return 'Requiere garantia. Montos sobre limite del analista pasan a administrador.';
  return 'Aprobacion directa hasta limite del analista. Montos superiores pasan a administrador.';
};

export const filterCreditClients = (clients: Client[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return clients.slice(0, 6);

  return clients.filter((client) => {
    const fullName = client.fullName.toLowerCase();
    return fullName.includes(normalizedQuery) || client.dni.includes(normalizedQuery);
  });
};

export const getApiErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { message?: string | string[] };

    if (Array.isArray(payload.message)) return payload.message.join(', ');
    if (payload.message) return payload.message;
    return 'No se pudo completar la operacion';
  } catch {
    return 'No se pudo completar la operacion';
  }
};

export const getClientInterestRate = (client: Client | null, defaultInterestRate: number, specialInterestRate: number) => {
  if (!client) return defaultInterestRate;
  if (client.isSpecial && client.specialInterestRate != null) return client.specialInterestRate;
  if (client.isSpecial) return specialInterestRate;
  return defaultInterestRate;
};

export const toRateFormValue = (value: number) => {
  return String(Math.round(value * 100000) / 1000);
};

export const toRateInputValue = (value: string) => {
  return Math.round(Number(value) * 1000) / 100000;
};
