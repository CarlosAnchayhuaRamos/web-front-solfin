import { getReversalVoucherHtml } from './reversal-voucher';

test('reversal voucher preserves amounts, original voucher and escapes user text', () => {
  const html = getReversalVoucherHtml({
    voucherCode: 'REV-1', originalVoucherCode: 'VCH-1', creditCode: 'CR-1',
    clientName: '<script>alert(1)</script>', clientDni: '12345678',
    administratorName: 'Admin', cashBox: 'Caja 1', reversedAt: '2026-09-10T18:00:00Z',
    reason: 'Pago & duplicado', amount: 110, cashDirection: 'OUT', remainingBalance: 500,
    details: [{ installmentNo: 2, amount: 110, baseAmount: 100, penaltyAmount: 10 }],
  }, 'http://localhost:3000');
  expect(html).toContain('VCH-1');
  expect(html).toContain('110.00');
  expect(html).toContain('100.00');
  expect(html).toContain('10.00');
  expect(html).toContain('500.00');
  expect(html).toContain('Salida de efectivo de caja');
  expect(html).toContain('Pago &amp; duplicado');
  expect(html).not.toContain('<script>');
});
