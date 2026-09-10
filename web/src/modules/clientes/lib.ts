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

export const normalizeDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

export const displayBirthDate = (value: string | null) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
};

export const toClientFormState = (client: Client): ClientFormState => {
  return {
    referenceName: client.referenceName ?? '',
    personalAddressReference: client.personalAddressReference ?? '',
    businessAddressReference: client.businessAddressReference ?? '',
    referencePhone: client.referencePhone ?? '',
    businessRuc: client.businessRuc ?? '',
    businessName: client.businessName ?? '',
    businessPhone: client.businessPhone ?? '',
    businessActivity: client.businessActivity ?? '',
    department: client.department ?? '',
    province: client.province ?? '',
    district: client.district ?? '',
    dni: client.dni,
    email: client.email ?? '',
    firstName: client.firstName,
    isSpecial: client.isSpecial,
    lastName: client.lastName,
    phone: client.phone,
    personalAddress: client.personalAddress ?? '',
    businessAddress: client.businessAddress ?? '',
    birthDate: displayBirthDate(client.birthDate),
    specialInterestRate: client.specialInterestRate == null ? '' : toRateFormValue(client.specialInterestRate),
    status: client.status,
  };
};

export const toClientPayload = (form: ClientFormState) => {
  return {
    ...form,
    birthDate: form.birthDate ? form.birthDate.split('-').reverse().join('-') : '',
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
