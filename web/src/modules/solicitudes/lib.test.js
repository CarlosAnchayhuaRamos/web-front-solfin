import { getPenaltyClause, printCreditContract, printDisbursementRequest } from './lib';

jest.mock('../../common/lib/print', () => ({
  ...jest.requireActual('../../common/lib/print'),
  printDocument: jest.fn(),
}));

const contract = {
  principalAmount: 1000, clientName: 'Cliente Prueba', clientDni: '12345678',
  clientAddress: 'Direccion', advisorName: 'Asesor', approvedByName: 'Administrador',
  approvedAt: '2026-11-09T12:00:00Z', creditCode: 'CR-1', interestRate: 0.1,
  installmentCount: 10, paymentFrequency: 'DAILY', interestCalculationMethod: 'EQUAL_INSTALLMENTS',
  penaltyTerms: { method: 'FIXED_DAILY', fixedDailyAmount: 1, graceDays: 0 },
  hasSpouse: true, spouseFullName: 'Pareja <Prueba>', spousePhone: '999111222',
  hasGuarantor: true, guarantorFullName: 'Aval & Prueba', guarantorPhone: '999333444',
};

const renderDocument = (print, data) => {
  const printWindow = { document: { open: jest.fn(), write: jest.fn(), close: jest.fn() } };
  print(printWindow, data);
  const container = document.createElement('div');
  container.innerHTML = printWindow.document.write.mock.calls[0][0];
  return container;
};

test.each([printCreditContract, printDisbursementRequest])('prints registered participants and their signatures safely', (print) => {
  const output = renderDocument(print, contract);
  const signatures = output.querySelector('.signatures').textContent;
  expect(signatures).toContain('Pareja <Prueba>');
  expect(signatures).toContain('Aval & Prueba');
  expect(signatures).toContain('999111222');
  expect(signatures).toContain('999333444');
  expect(output.querySelector('prueba')).toBeNull();
});

test.each([printCreditContract, printDisbursementRequest])('omits participants when flags are disabled, even with stale names', (print) => {
  const output = renderDocument(print, { ...contract, hasSpouse: false, hasGuarantor: false });
  expect(output.textContent).not.toContain('Pareja <Prueba>');
  expect(output.textContent).not.toContain('Aval & Prueba');
  expect(output.querySelector('.signatures').textContent).not.toMatch(/AVAL|CÓNYUGE/);
});

test('second clause includes both participants', () => {
  const output = renderDocument(printCreditContract, contract);
  const second = [...output.querySelectorAll('h2')].find((heading) => heading.textContent === 'SEGUNDO');
  let text = '';
  for (let node = second.nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling) text += node.textContent;
  expect(text).toContain('Pareja <Prueba>');
  expect(text).toContain('Aval & Prueba');
});

test('contract distinguishes fixed, simple and capped penalty terms', () => {
  const terms = { method: 'FIXED_DAILY', fixedDailyAmount: 2.5, graceDays: 2, rate: 0.01, capRate: 0.15 };
  expect(getPenaltyClause(terms)).toContain('S/ 2.50');
  expect(getPenaltyClause(terms)).not.toContain('anual');
  expect(getPenaltyClause({ ...terms, method: 'SIMPLE' })).toContain('1.000% diario');
  expect(getPenaltyClause({ ...terms, method: 'CAPPED_SIMPLE' })).toContain('15.000%');
  expect(getPenaltyClause(terms)).toContain('2 dias de gracia');
});
