import type { ReportItem } from './types';
import type { PortfolioReport } from './types';
import { escapePrintHtml, getPrintBrandMarkup, getPrintBrandStyles, printDocument } from '../../common/lib/print';
import { formatDueDate, formatMoney } from '../../common/lib/format';

export const getReportActionLabel = (report: ReportItem) => {
  if (report.status === 'QUEUED') return 'En cola';
  if (report.id === 'REP-001') return 'Imprimir';
  return `Exportar ${report.format}`;
};

export const getApiErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(', ');
    return data.message ?? 'No se pudo generar el reporte';
  } catch {
    return 'No se pudo generar el reporte';
  }
};

export const printPortfolioReport = (report: PortfolioReport) => {
  const printWindow = window.open('', '_blank', 'width=1120,height=760');

  if (!printWindow) return false;

  const rows = report.clients
    .map(
      (client) => `
        <tr>
          <td>${escapePrintHtml(client.clientName)}</td>
          <td>${escapePrintHtml(client.clientDni)}</td>
          <td>${escapePrintHtml(client.clientPhone)}</td>
          <td>${client.creditCount}</td>
          <td>${formatMoney(client.principalAmount)}</td>
          <td>${formatMoney(client.outstandingAmount)}</td>
          <td>${formatMoney(client.overdueAmount)}</td>
          <td>${client.overdueRate.toFixed(1)}%</td>
          <td>${client.nextDueDate ? formatDueDate(client.nextDueDate) : '-'}</td>
        </tr>
      `,
    )
    .join('');
  const scopeLabel = report.scope === 'ANALYST_PORTFOLIO' ? 'Cartera asignada del analista' : 'Cartera general';

  printWindow.document.open();
  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte de cartera</title>
        <style>
          @page { margin: 12mm; size: A4 landscape; }
          body { color: #111827; font-family: Arial, sans-serif; font-size: 10px; margin: 0; }
          h1 { font-size: 20px; margin: 16px 0 4px; }
          p { margin: 3px 0; }
          table { border-collapse: collapse; margin-top: 14px; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 6px; text-align: right; vertical-align: top; }
          th { background: #eef2f7; color: #111827; font-size: 9px; text-transform: uppercase; }
          th:first-child, td:first-child, th:nth-child(2), td:nth-child(2), th:nth-child(3), td:nth-child(3), th:nth-child(9), td:nth-child(9) { text-align: left; }
          .summary { display: grid; gap: 8px; grid-template-columns: repeat(6, minmax(0, 1fr)); margin-top: 14px; }
          .summary div { border: 1px solid #d1d5db; padding: 8px; }
          .summary span { color: #6b7280; display: block; font-size: 9px; text-transform: uppercase; }
          .summary strong { display: block; font-size: 13px; margin-top: 3px; }
          ${getPrintBrandStyles()}
          @media print {
            th { background: transparent; }
          }
        </style>
      </head>
      <body>
        ${getPrintBrandMarkup(window.location.origin)}
        <h1>Reporte de cartera</h1>
        <p><strong>Alcance:</strong> ${scopeLabel}</p>
        <p><strong>Generado:</strong> ${new Date(report.generatedAt).toLocaleString('es-PE')}</p>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Telefono</th>
              <th>Creditos</th>
              <th>Volumen credito</th>
              <th>Saldo cartera</th>
              <th>Mora</th>
              <th>% mora</th>
              <th>Prox. vencimiento</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="9">Sin cartera para mostrar.</td></tr>'}</tbody>
        </table>
        <section class="summary">
          <div><span>Clientes</span><strong>${report.summary.clientCount}</strong></div>
          <div><span>Creditos</span><strong>${report.summary.creditCount}</strong></div>
          <div><span>Volumen credito</span><strong>${formatMoney(report.summary.principalAmount)}</strong></div>
          <div><span>Saldo cartera</span><strong>${formatMoney(report.summary.outstandingAmount)}</strong></div>
          <div><span>Mora total</span><strong>${formatMoney(report.summary.overdueAmount)}</strong></div>
          <div><span>Indicador mora</span><strong>${report.summary.overdueRate.toFixed(1)}%</strong></div>
        </section>
      </body>
    </html>
  `);
  printWindow.document.close();
  printDocument(printWindow);
  return true;
};
