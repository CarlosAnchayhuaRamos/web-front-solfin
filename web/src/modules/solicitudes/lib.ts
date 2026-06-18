import { escapePrintHtml, getPrintBrandMarkup, getPrintBrandStyles, printDocument } from '../../common/lib/print';
import { contractClauses, contractCompany } from './data';
import type { ApprovalRequest, ApprovalRequestFilters } from './types';
import type { CreditContractData } from './types';

export const getPendingRequests = (requests: ApprovalRequest[]) => {
  return requests.filter((request) => request.status === 'PENDING');
};

export const filterApprovalRequests = (requests: ApprovalRequest[], filters: ApprovalRequestFilters) => {
  return requests.filter((request) => {
    const requestedDate = request.requestedAt.slice(0, 10);
    const matchesStatus = filters.status === 'ALL' || request.status === filters.status;
    const matchesFrom = !filters.dateFrom || requestedDate >= filters.dateFrom;
    const matchesTo = !filters.dateTo || requestedDate <= filters.dateTo;

    return matchesStatus && matchesFrom && matchesTo;
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

export const printCreditContract = (printWindow: Window, contract: CreditContractData) => {
  const amount = formatContractMoney(contract.principalAmount);
  const amountWords = `${numberToSpanishWords(Math.floor(contract.principalAmount))} Y ${String(Math.round((contract.principalAmount % 1) * 100)).padStart(2, '0')}/100 SOLES`;
  const clientAddress = escapePrintHtml(contract.clientAddress?.trim() || '________________________________________');
  const clientDni = escapePrintHtml(contract.clientDni);
  const clientName = escapePrintHtml(contract.clientName.toUpperCase());
  const advisorName = escapePrintHtml(contract.advisorName);
  const approvedByName = escapePrintHtml(contract.approvedByName);
  const approvedDate = new Date(contract.approvedAt);
  const dateText = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(approvedDate).toUpperCase();
  const effectiveAnnualInterest = (Math.pow(1 + contract.interestRate, 12) - 1) * 100;
  const effectiveAnnualPenalty = (Math.pow(1 + contract.penaltyRate, 365) - 1) * 100;
  const paymentFrequencyLabel = getPaymentFrequencyLabel(contract.paymentFrequency);
  const staticClauses = contractClauses.map(([title, body]) => `<h2>${title}</h2><p>${body}</p>`).join('');

  printWindow.document.open();
  printWindow.document.write(`
    <html>
      <head>
        <title>Contrato ${escapePrintHtml(contract.creditCode)}</title>
        <style>
          @page { margin: 18mm 16mm; size: A4; }
          body { color: #111; font-family: Arial, sans-serif; font-size: 9.5pt; line-height: 1.25; margin: 0; }
          h1 { font-size: 14pt; margin: 12px 0; text-align: center; }
          h2 { font-size: 9.5pt; margin: 9px 0 2px; }
          p { margin: 0 0 5px; text-align: justify; }
          .meta { display: grid; gap: 2px 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 8px 0 10px; }
          .meta p { margin: 0; text-align: left; }
          .signatures { display: grid; gap: 40px 40px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 56px; page-break-inside: avoid; text-align: center; }
          .signature { border-top: 1px solid #111; padding-top: 5px; }
          ${getPrintBrandStyles()}
        </style>
      </head>
      <body>
        ${getPrintBrandMarkup(window.location.origin)}
        <h1>CONTRATO DE MUTUO</h1>
        <div class="meta">
          <p><strong>Crédito:</strong> ${escapePrintHtml(contract.creditCode)}</p>
          <p><strong>Asesor:</strong> ${advisorName}</p>
          <p><strong>Aprobado por:</strong> ${approvedByName}</p>
          <p><strong>Fecha:</strong> ${dateText}</p>
          <p><strong>Monto:</strong> ${amount}</p>
          <p><strong>Frecuencia:</strong> ${paymentFrequencyLabel}</p>
          <p><strong>Cuota:</strong> ${formatContractMoney(contract.installmentAmount)}</p>
          <p><strong>Total:</strong> ${formatContractMoney(contract.totalAmount)}</p>
        </div>
        <p>Conste por el presente documento el contrato de préstamo de dinero que se suscribe por duplicado, celebrado de una parte por <strong>${contractCompany.name}</strong>, con RUC ${contractCompany.ruc}, con domicilio en ${contractCompany.address}, a quien en adelante se denominará LA EMPRESA, debidamente representada por su Gerente General, la Sra. ${contractCompany.legalRepresentative}, identificada con DNI Nº ${contractCompany.legalRepresentativeDni}; y, de la otra parte, el(la) cliente(a), señor(a) <strong>${clientName}</strong>, identificado(a) con DNI Nº <strong>${clientDni}</strong>, de estado civil ____________________, señalando domicilio en <strong>${clientAddress}</strong>, a quien en adelante se denominará EL CLIENTE; y el(la) cónyuge o conviviente de EL CLIENTE, señor(a) ______________________________.</p>
        <h2>PRIMERO</h2>
        <p>LA EMPRESA, atendiendo a la solicitud de EL CLIENTE y a la información proporcionada por este, conviene en otorgarle un crédito ascendente a la suma de <strong>${amountWords}</strong> (${amount}), el mismo que será abonado a su cuenta _______________ en LA EMPRESA, a su entera conformidad, y se obliga a devolverlo en los términos pactados.</p>
        <h2>SEGUNDO</h2>
        <p>El préstamo otorgado generará un interés compensatorio a la tasa efectiva anual de <strong>${effectiveAnnualInterest.toFixed(2)}%</strong> y un interés moratorio a la tasa efectiva anual de <strong>${effectiveAnnualPenalty.toFixed(2)}%</strong>; este último será aplicado adicionalmente sobre las cuotas no pagadas a su vencimiento, además de los gastos de cobranza administrativa y/o judicial.</p>
        <h2>TERCERO</h2>
        <p>EL CLIENTE se compromete a devolver el préstamo otorgado en <strong>${contract.installmentCount} cuotas</strong> de frecuencia <strong>${paymentFrequencyLabel}</strong>, establecidas en el cronograma de pagos entregado a EL CLIENTE, el cual se anexa al presente.</p>
        ${staticClauses}
        <h2>CLÁUSULA ADICIONAL</h2>
        <p>Interviene en el presente contrato el(la) cónyuge o conviviente de EL CLIENTE, identificado(a) con DNI Nº ___________, con domicilio en _______________________________________, constituyéndose en co-deudor(a) de EL CLIENTE y asumiendo en forma solidaria todas las obligaciones hasta la total cancelación de la deuda, renunciando a su derecho de excusión.</p>
        <h2>SEGUNDA CLÁUSULA ADICIONAL</h2>
        <p>Intervienen asimismo los señores(as) ________________________________________, identificado(a) con DNI Nº ___________, con domicilio en __________________________________________________; ________________________________________, identificado(a) con DNI Nº ___________, con domicilio en __________________________________________________; __________________, identificado(a) con DNI Nº ___________, con domicilio en __________________________________________________________________; e __________________, identificado(a) con DNI Nº ___________, con domicilio en __________________________________________________________________; para constituirse como garantes solidarios de EL CLIENTE, asumiendo en forma solidaria todas las obligaciones hasta la cancelación total de la deuda, renunciando a su derecho de excusión.</p>
        <p>Se suscribe el presente contrato por duplicado, en la ciudad de AYACUCHO, el ${dateText}.</p>
        <section class="signatures">
          <div class="signature"><strong>CLIENTE</strong><br />${clientName}<br />DNI ${clientDni}</div>
          <div class="signature"><strong>AVAL</strong></div>
          <div class="signature"><strong>CÓNYUGE</strong></div>
          <div class="signature"><strong>AVAL</strong></div>
          <div class="signature"><strong>LA EMPRESA</strong><br />${contractCompany.legalRepresentative}</div>
          <div class="signature"><strong>ASESOR</strong><br />${advisorName}</div>
        </section>
      </body>
    </html>
  `);
  printWindow.document.close();
  printDocument(printWindow);
};

export const printApprovedPaymentSchedule = (printWindow: Window, contract: CreditContractData) => {
  const clientName = escapePrintHtml(contract.clientName);
  const creditCode = escapePrintHtml(contract.creditCode);
  const totalPrincipal = contract.schedules.reduce((total, schedule) => total + schedule.principal, 0);
  const totalInterest = contract.schedules.reduce((total, schedule) => total + schedule.interest, 0);
  const totalDue = contract.schedules.reduce((total, schedule) => total + schedule.totalDue, 0);
  const rows = contract.schedules
    .map(
      (schedule) => `
        <tr>
          <td>${schedule.installmentNo}</td>
          <td>${new Date(schedule.dueDate).toLocaleDateString('es-PE')}</td>
          <td>${formatContractMoney(schedule.principal)}</td>
          <td>${formatContractMoney(schedule.interest)}</td>
          <td>${formatContractMoney(schedule.totalDue)}</td>
        </tr>
      `,
    )
    .join('');

  printWindow.document.open();
  printWindow.document.write(`
    <html>
      <head>
        <title>Cronograma ${creditCode}</title>
        <style>
          @page { margin: 16mm; size: A4; }
          body { color: #111827; font-family: Arial, sans-serif; margin: 0; }
          h1 { font-size: 22px; margin: 20px 0 16px; text-align: center; }
          p { margin: 4px 0; }
          ${getPrintBrandStyles()}
          table { border-collapse: collapse; margin-top: 18px; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
          th { background: #f3f4f6; }
          th:first-child, td:first-child, th:nth-child(2), td:nth-child(2) { text-align: left; }
          .meta { display: grid; gap: 6px 18px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0 0 12px; }
          .meta p { margin: 0; }
          .table-total td { font-weight: 700; }
          .signatures { display: grid; gap: 56px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 72px; page-break-inside: avoid; text-align: center; }
          .signature { border-top: 1px solid #111827; padding-top: 6px; }
          @media print { th { background: transparent; } }
        </style>
      </head>
      <body>
        ${getPrintBrandMarkup(window.location.origin)}
        <h1>Cronograma de pagos</h1>
        <section class="meta">
          <p><strong>Credito:</strong> ${creditCode}</p>
          <p><strong>Cliente:</strong> ${clientName}</p>
          <p><strong>Monto:</strong> ${formatContractMoney(contract.principalAmount)}</p>
          <p><strong>Frecuencia:</strong> ${getPaymentFrequencyLabel(contract.paymentFrequency)}</p>
        </section>
        <table>
          <thead><tr><th>Cuota</th><th>Vence</th><th>Capital</th><th>Interes</th><th>Total</th></tr></thead>
          <tbody>
            ${rows}
            <tr class="table-total">
              <td colspan="2">Total</td>
              <td>${formatContractMoney(totalPrincipal)}</td>
              <td>${formatContractMoney(totalInterest)}</td>
              <td>${formatContractMoney(totalDue)}</td>
            </tr>
          </tbody>
        </table>
        <section class="signatures">
          <div class="signature"><strong>CLIENTE</strong><br />${clientName}</div>
          <div class="signature"><strong>GERENTE DE LA EMPRESA</strong></div>
        </section>
      </body>
    </html>
  `);
  printWindow.document.close();
  printDocument(printWindow);
};

export const printDisbursementRequest = (printWindow: Window, contract: CreditContractData) => {
  const clientName = escapePrintHtml(contract.clientName);
  const clientDni = escapePrintHtml(contract.clientDni);
  const approvedByName = escapePrintHtml(contract.approvedByName);
  const advisorName = escapePrintHtml(contract.advisorName);

  printWindow.document.open();
  printWindow.document.write(`
    <html>
      <head>
        <title>Solicitud de desembolso ${escapePrintHtml(contract.creditCode)}</title>
        <style>
          @page { margin: 18mm; size: A4; }
          body { color: #111827; font-family: Arial, sans-serif; margin: 0; }
          h1 { font-size: 20px; margin: 24px 0; text-align: center; }
          p { line-height: 1.6; margin: 10px 0; }
          .details { border: 1px solid #9ca3af; display: grid; gap: 8px; margin: 24px 0; padding: 16px; }
          .signatures { display: grid; gap: 56px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 90px; text-align: center; }
          .signature { border-top: 1px solid #111827; padding-top: 6px; }
          ${getPrintBrandStyles()}
        </style>
      </head>
      <body>
        ${getPrintBrandMarkup(window.location.origin)}
        <h1>SOLICITUD DE DESEMBOLSO DE DINERO</h1>
        <p>Se solicita realizar el desembolso correspondiente al credito aprobado con los siguientes datos:</p>
        <section class="details">
          <p><strong>Credito:</strong> ${escapePrintHtml(contract.creditCode)}</p>
          <p><strong>Cliente:</strong> ${clientName}</p>
          <p><strong>DNI:</strong> ${clientDni}</p>
          <p><strong>Monto a desembolsar:</strong> ${formatContractMoney(contract.principalAmount)}</p>
          <p><strong>Fecha de aprobacion:</strong> ${new Date(contract.approvedAt).toLocaleString('es-PE')}</p>
          <p><strong>Aprobado por:</strong> ${approvedByName}</p>
          <p><strong>Asesor:</strong> ${advisorName}</p>
        </section>
        <section class="signatures">
          <div class="signature"><strong>CLIENTE</strong><br />${clientName}<br />DNI ${clientDni}</div>
          <div class="signature"><strong>RESPONSABLE DE DESEMBOLSO</strong></div>
        </section>
      </body>
    </html>
  `);
  printWindow.document.close();
  printDocument(printWindow);
};

const formatContractMoney = (value: number) => {
  return new Intl.NumberFormat('es-PE', { currency: 'PEN', minimumFractionDigits: 2, style: 'currency' }).format(value);
};

const numberToSpanishWords = (value: number): string => {
  if (value === 0) return 'CERO';
  if (value < 0) return `MENOS ${numberToSpanishWords(Math.abs(value))}`;
  if (value < 30) return units[value];
  if (value < 100) {
    const remainder = value % 10;
    if (!remainder) return tens[Math.floor(value / 10)];
    return `${tens[Math.floor(value / 10)]} Y ${numberToSpanishWords(remainder)}`;
  }
  if (value === 100) return 'CIEN';
  if (value < 1000) {
    const remainder = value % 100;
    const prefix = hundreds[Math.floor(value / 100)];
    if (!remainder) return prefix;
    return `${prefix} ${numberToSpanishWords(remainder)}`;
  }
  if (value === 1000) return 'MIL';
  if (value < 2000) return `MIL ${numberToSpanishWords(value % 1000)}`;
  if (value < 1_000_000) {
    const remainder = value % 1000;
    const prefix = `${numberToSpanishWords(Math.floor(value / 1000))} MIL`;
    if (!remainder) return prefix;
    return `${prefix} ${numberToSpanishWords(remainder)}`;
  }
  return String(value);
};

const units = [
  'CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE',
  'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO',
  'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
];
const tens = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

const getPaymentFrequencyLabel = (paymentFrequency: CreditContractData['paymentFrequency']) => {
  if (paymentFrequency === 'DAILY') return 'Diario';
  if (paymentFrequency === 'WEEKLY') return 'Semanal';
  return 'Mensual';
};
