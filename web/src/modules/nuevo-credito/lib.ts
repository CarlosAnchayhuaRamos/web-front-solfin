import type { CreditProductOption } from './types';
import type { Client } from '../clientes/types';

export const getProductDescription = (product: CreditProductOption) => {
  if (product.requiresGuarantee) return 'Requiere garantia y documentos de respaldo.';
  return 'Aprobacion rapida con evaluacion basica.';
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
