import { formatMoney } from '../../common/lib/format';
import { escapePrintHtml, getPrintBrandMarkup, getPrintBrandStyles } from '../../common/lib/print';
import type { ReversalVoucher } from './types';

export const getReversalVoucherHtml = (voucher: ReversalVoucher, origin: string) => {
  const date = new Date(voucher.reversedAt).toLocaleString('es-PE', { timeZone: 'America/Lima' });
  const rows = voucher.details.map((detail) => `<tr>
    <td>${detail.installmentNo}</td>
    <td>${formatMoney(detail.baseAmount)}</td>
    <td>${formatMoney(detail.penaltyAmount)}</td>
    <td>${formatMoney(detail.amount)}</td>
  </tr>`).join('');
  const direction = getReversalDirectionLabel(voucher.cashDirection);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
    <title>Reversion ${escapePrintHtml(voucher.voucherCode)}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111827; padding: 24px; }
      h1 { font-size: 18px; text-align: center; margin: 18px 0; }
      dl { display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 6px 12px; }
      dt { font-weight: bold; } dd { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
      table { border-collapse: collapse; width: 100%; margin-top: 18px; }
      th, td { padding: 8px; border-bottom: 1px solid #d1d5db; text-align: right; }
      th:first-child, td:first-child { text-align: left; }
      .total { font-weight: bold; font-size: 15px; margin-top: 18px; }
      ${getPrintBrandStyles()}
      @media print { body { padding: 0; } tr { break-inside: avoid; } }
    </style></head><body>
    ${getPrintBrandMarkup(origin)}
    <h1>Voucher de reversion</h1>
    <dl>
      <dt>Comprobante</dt><dd>${escapePrintHtml(voucher.voucherCode)}</dd>
      <dt>Comprobante original</dt><dd>${escapePrintHtml(voucher.originalVoucherCode ?? 'No aplica')}</dd>
      <dt>Credito</dt><dd>${escapePrintHtml(voucher.creditCode)}</dd>
      <dt>Cliente</dt><dd>${escapePrintHtml(voucher.clientName)}</dd>
      <dt>DNI</dt><dd>${escapePrintHtml(voucher.clientDni)}</dd>
      <dt>Fecha (Peru)</dt><dd>${escapePrintHtml(date)}</dd>
      <dt>Administrador</dt><dd>${escapePrintHtml(voucher.administratorName)}</dd>
      <dt>Caja</dt><dd>${escapePrintHtml(voucher.cashBox ?? 'Sin movimiento de caja')}</dd>
      <dt>Movimiento</dt><dd>${direction}</dd>
      <dt>Motivo</dt><dd>${escapePrintHtml(voucher.reason)}</dd>
    </dl>
    ${rows ? `<table><thead><tr><th>Cuota</th><th>Capital e interes</th><th>Mora</th><th>Revertido</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
    <p class="total">Total revertido: ${formatMoney(voucher.amount)}</p>
    <p>Saldo del credito despues de la reversion: ${formatMoney(voucher.remainingBalance)}</p>
    </body></html>`;
};

const getReversalDirectionLabel = (direction: ReversalVoucher['cashDirection']) => {
  if (direction === 'IN') return 'Ingreso de efectivo a caja';
  if (direction === 'OUT') return 'Salida de efectivo de caja';
  return 'Sin movimiento de efectivo';
};
