import { initialCreditDocumentChecklist } from './data';
import type { Client, ClientFilters, ClientFormState, CreditDocumentChecklist } from './types';

export const getClientRiskLabel = (client: Client) => {
  if (client.status === 'BLOCKED') return 'Bloqueado';
  if (client.status === 'WATCHLIST') return 'Observado';
  if (client.status === 'INACTIVE') return 'Inactivo';
  return 'Activo';
};

export const getClientRiskColor = (client: Client) => {
  if (client.status === 'BLOCKED') return 'red';
  if (client.status === 'WATCHLIST') return 'yellow';
  if (client.status === 'INACTIVE') return 'gray';
  return 'blue';
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

export const toClientFormState = (client: Client): ClientFormState => {
  return {
    dni: client.dni,
    email: client.email ?? '',
    firstName: client.firstName,
    isSpecial: client.isSpecial,
    lastName: client.lastName,
    phone: client.phone,
    personalAddress: client.personalAddress ?? '',
    businessAddress: client.businessAddress ?? '',
    birthDate: client.birthDate ?? '',
    specialInterestRate: client.specialInterestRate == null ? '' : toRateFormValue(client.specialInterestRate),
    status: client.status,
  };
};

export const toClientPayload = (form: ClientFormState) => {
  return {
    ...form,
    specialInterestRate: form.isSpecial && form.specialInterestRate.trim()
      ? toRateInputValue(form.specialInterestRate)
      : null,
  };
};

export const filterClients = (clients: Client[], filters: ClientFilters) => {
  const name = filters.name.trim().toLowerCase();
  const dni = filters.dni.trim();

  return clients.filter((client) => {
    const matchesName = !name || client.fullName.toLowerCase().includes(name);
    const matchesDni = !dni || client.dni.includes(dni);

    return matchesName && matchesDni;
  });
};

export const getCreditDocumentChecklist = (
  documentsByCreditId: Record<string, CreditDocumentChecklist>,
  creditId: string | null,
) => {
  if (!creditId) return initialCreditDocumentChecklist;
  return documentsByCreditId[creditId] ?? initialCreditDocumentChecklist;
};

export const isCreditDocumentChecklistComplete = (checklist: CreditDocumentChecklist) => {
  if (!checklist.schedule) return false;
  if (!checklist.contract) return false;
  return checklist.disbursementRequest;
};

export const getPendingCreditDocumentLabels = (checklist: CreditDocumentChecklist) => {
  const labels: string[] = [];

  if (!checklist.schedule) labels.push('cronograma');
  if (!checklist.contract) labels.push('contrato');
  if (!checklist.disbursementRequest) labels.push('solicitud de desembolso');

  return labels.join(', ');
};

const toRateFormValue = (value: number) => {
  return String(Math.round(value * 100000) / 1000);
};

const toRateInputValue = (value: string) => {
  return Math.round(Number(value) * 1000) / 100000;
};
