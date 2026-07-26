import { filterCreditClients, getClientInterestRate, toRateFormValue, toRateInputValue } from './lib';

const client = (overrides) => ({
  activeCredits: 0,
  birthDate: null,
  businessAddress: null,
  dni: '00000000',
  email: null,
  firstName: 'Nombre',
  fullName: 'Nombre Cliente',
  id: 'client-id',
  isSpecial: false,
  lastName: 'Cliente',
  personalAddress: null,
  phone: '999999999',
  specialInterestRate: null,
  status: 'ACTIVE',
  totalDebt: 0,
  ...overrides,
});

describe('nuevo-credito lib', () => {
  it('filters clients by name or DNI and limits empty query to six', () => {
    const clients = Array.from({ length: 7 }, (_, index) =>
      client({ dni: `7000000${index}`, fullName: `Cliente ${index}`, id: `client-${index}` }),
    );

    expect(filterCreditClients(clients, '')).toHaveLength(6);
    expect(filterCreditClients(clients, 'cliente 6')).toHaveLength(1);
    expect(filterCreditClients(clients, '70000003')[0].id).toBe('client-3');
  });

  it('selects client-specific, policy special, or default interest rate', () => {
    expect(getClientInterestRate(null, 0.12, 0.09)).toBe(0.12);
    expect(getClientInterestRate(client({ isSpecial: false }), 0.12, 0.09)).toBe(0.12);
    expect(getClientInterestRate(client({ isSpecial: true }), 0.12, 0.09)).toBe(0.09);
    expect(getClientInterestRate(client({ isSpecial: true, specialInterestRate: 0.075 }), 0.12, 0.09)).toBe(0.075);
  });

  it('converts monthly percentage rates between form and API values', () => {
    expect(toRateFormValue(0.12345)).toBe('12.345');
    expect(toRateInputValue('12.345')).toBe(0.12345);
  });
});
