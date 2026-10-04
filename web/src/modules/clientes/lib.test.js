import { filterClients, normalizeDateInput, toClientFormState, toClientPayload } from './lib';

const client = (overrides) => ({
  activeCredits: 0,
  birthDate: null,
  businessAddress: null,
  businessAddressReference: null,
  businessActivity: null,
  businessName: null,
  businessPhone: null,
  businessRuc: null,
  department: null,
  district: null,
  dni: '12345678',
  email: null,
  firstName: 'Carlos',
  fullName: 'Carlos Medina',
  guarantorFullName: null,
  guarantorPhone: null,
  hasGuarantor: false,
  hasSpouse: false,
  id: 'client-id',
  isSpecial: false,
  lastName: 'Medina',
  personalAddress: null,
  personalAddressReference: null,
  phone: '999999999',
  province: null,
  referenceName: null,
  referencePhone: null,
  specialInterestRate: null,
  spouseFullName: null,
  spousePhone: null,
  status: 'ACTIVE',
  totalDebt: 0,
  ...overrides,
});

const form = (overrides) => ({
  birthDate: '',
  businessAddress: '',
  businessAddressReference: '',
  businessActivity: '',
  businessName: '',
  businessPhone: '',
  businessRuc: '',
  department: '',
  district: '',
  dni: '12345678',
  email: '',
  firstName: 'Carlos',
  guarantorFullName: '',
  guarantorPhone: '',
  hasGuarantor: false,
  hasSpouse: false,
  isSpecial: false,
  lastName: 'Medina',
  personalAddress: '',
  personalAddressReference: '',
  phone: '999999999',
  province: '',
  referenceName: '',
  referencePhone: '',
  specialInterestRate: '',
  spouseFullName: '',
  spousePhone: '',
  status: 'ACTIVE',
  ...overrides,
});

describe('clientes lib', () => {
  it('keeps contact information separate from address references when editing and saving', () => {
    const saved = client({ referenceName: 'Ana', referencePhone: '999111222',
      personalAddressReference: 'Frente al parque', businessAddressReference: 'Al lado del mercado' });
    const payload = toClientPayload(toClientFormState(saved));
    expect(payload).toMatchObject({ referenceName: 'Ana', referencePhone: '999111222',
      personalAddressReference: 'Frente al parque', businessAddressReference: 'Al lado del mercado' });
    expect(toClientFormState(client({ personalAddressReference: null, businessAddressReference: null })))
      .toMatchObject({ personalAddressReference: '', businessAddressReference: '' });
  });

  it('clears spouse and guarantor details when checkboxes are disabled', () => {
    const payload = toClientPayload(form({
      guarantorFullName: 'Luis Perez',
      guarantorPhone: '988777666',
      hasGuarantor: false,
      hasSpouse: false,
      spouseFullName: 'Ana Perez',
      spousePhone: '999888777',
    }));

    expect(payload).toMatchObject({
      guarantorFullName: '',
      guarantorPhone: '',
      spouseFullName: '',
      spousePhone: '',
    });
  });
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
