import { filterClients, normalizeDateInput, toClientPayload } from './lib';

const client = (overrides) => ({
  activeCredits: 0,
  birthDate: null,
  businessAddress: null,
  dni: '12345678',
  email: null,
  firstName: 'Carlos',
  fullName: 'Carlos Medina',
  id: 'client-id',
  isSpecial: false,
  lastName: 'Medina',
  personalAddress: null,
  phone: '999999999',
  specialInterestRate: null,
  status: 'ACTIVE',
  totalDebt: 0,
  ...overrides,
});

const form = (overrides) => ({
  birthDate: '',
  businessAddress: '',
  dni: '12345678',
  email: '',
  firstName: 'Carlos',
  isSpecial: false,
  lastName: 'Medina',
  personalAddress: '',
  phone: '999999999',
  specialInterestRate: '',
  status: 'ACTIVE',
  ...overrides,
});

describe('clientes lib', () => {
  it('filters clients by name and DNI', () => {
    const clients = [
      client({ dni: '11111111', fullName: 'Carlos Medina', id: '1' }),
      client({ dni: '22222222', fullName: 'Maria Quispe', id: '2' }),
    ];

    expect(filterClients(clients, { dni: '', name: 'maria' })).toEqual([clients[1]]);
    expect(filterClients(clients, { dni: '111', name: '' })).toEqual([clients[0]]);
  });

  it('maps optional special interest rate to API decimal value', () => {
    expect(toClientPayload(form({ isSpecial: true, specialInterestRate: '7.125' })).specialInterestRate).toBe(0.07125);
    expect(toClientPayload(form({ isSpecial: true, specialInterestRate: '' })).specialInterestRate).toBeNull();
    expect(toClientPayload(form({ isSpecial: false, specialInterestRate: '7.125' })).specialInterestRate).toBeNull();
  });

  it('normalizes typed date input without native calendar', () => {
    expect(normalizeDateInput('25011990')).toBe('25-01-1990');
    expect(normalizeDateInput('25-01')).toBe('25-01');
    expect(normalizeDateInput('25/01/1990')).toBe('25-01-1990');
    expect(toClientPayload(form({ birthDate: '25-01-1990' })).birthDate).toBe('1990-01-25');
  });
});
