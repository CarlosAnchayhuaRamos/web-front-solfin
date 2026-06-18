import React, { useEffect, useState } from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { formatMoney, formatPercentage } from '../../common/lib/format';
import { escapePrintHtml, getPrintBrandMarkup, getPrintBrandStyles, printDocument } from '../../common/lib/print';
import { PageHeader } from '../../common/layout/PageHeader';
import { creditProductOptions, initialCreditForm, paymentFrequencyOptions } from './data';
import { useCreditClients, useCreditPolicyParameters, useCreditRegistration } from './hooks';
import { filterCreditClients, getProductDescription } from './lib';
import type { CreditFormState, CreditProductType, PaymentFrequency, RegisteredCredit } from './types';

export const NuevoCreditoView: React.FC = () => {
  const { clients, error: clientsError, fetchClients, isLoading } = useCreditClients();
  const { clearSimulation, error, isRegistering, isSimulating, registerCredit, simulateCredit, simulation } = useCreditRegistration();
  const { fetchCreditPolicyParameters, maxRequestFiles } = useCreditPolicyParameters();
  const [form, setForm] = useState<CreditFormState>(initialCreditForm);
  const [isClientComboboxOpen, setIsClientComboboxOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchClients();
    void fetchCreditPolicyParameters();
  }, [fetchClients, fetchCreditPolicyParameters]);

  const filteredClients = clients ? filterCreditClients(clients, form.clientSearch) : [];
  const selectedClient = clients?.find((client) => client.id === form.clientId) ?? null;

  const handleChange = (field: keyof CreditFormState, value: string) => {
    setSuccessMessage(null);
    setFileError(null);
    clearSimulation();

    if (field === 'clientSearch') {
      setIsClientComboboxOpen(true);
    }

    setForm((currentForm) => ({
      ...currentForm,
      clientId: field === 'clientSearch' ? '' : currentForm.clientId,
      [field]: value,
    }));
  };

  const handleFilesChange = (files: FileList | null) => {
    setSuccessMessage(null);
    setFileError(null);

    if (!files) {
      setForm((currentForm) => ({ ...currentForm, files: [] }));
      return;
    }

    const nextFiles = Array.from(files);

    if (nextFiles.length > maxRequestFiles) {
      setFileError(`Maximo ${maxRequestFiles} archivos permitidos`);
      setForm((currentForm) => ({ ...currentForm, files: nextFiles.slice(0, maxRequestFiles) }));
      return;
    }

    setForm((currentForm) => ({ ...currentForm, files: nextFiles }));
  };

  const handleProductChange = (productType: CreditProductType) => {
    const product = creditProductOptions.find((option) => option.id === productType);

    setSuccessMessage(null);
    clearSimulation();
    setForm((currentForm) => ({
      ...currentForm,
      installments: product ? String(product.defaultInstallments) : currentForm.installments,
      productType,
    }));
  };

  const handleSelectClient = (clientId: string, clientLabel: string) => {
    setIsClientComboboxOpen(false);
    setForm((currentForm) => ({
      ...currentForm,
      clientId,
      clientSearch: clientLabel,
    }));
  };

  const handleSimulate = async () => {
    setSuccessMessage(null);
    await simulateCredit(form);
  };

  const handleRegister = async () => {
    setSuccessMessage(null);

    const registered = await registerCredit(form);

    if (!registered) return;

    setForm(initialCreditForm);
    setIsClientComboboxOpen(false);
    setSuccessMessage(
      registered.status === 'PENDING_APPROVAL'
        ? 'Credito registrado y enviado a solicitudes. Cronograma pendiente de aprobacion.'
        : 'Credito registrado y aprobado correctamente',
    );

  };

  return (
    <>
      <PageHeader
        actions={
          <Button disabled={isRegistering} onClick={handleRegister}>
            {isRegistering ? 'Registrando...' : 'Registrar'}
          </Button>
        }
        description="Registra un credito Express o con Garantia y genera el cronograma antes de guardarlo."
        title="Nuevo credito"
      />
      {clientsError ? (
        <div className="card">
          <div className="card__body message--error">{clientsError}</div>
        </div>
      ) : null}
      {error ? (
        <div className="card">
          <div className="card__body message--error">{error}</div>
        </div>
      ) : null}
      {fileError ? (
        <div className="card">
          <div className="card__body message--error">{fileError}</div>
        </div>
      ) : null}
      {successMessage ? (
        <div className="card">
          <div className="card__body message--success">{successMessage}</div>
        </div>
      ) : null}
      <section className="grid grid--two">
        <Card>
          <CardHeader
            action={
              <Button disabled={isSimulating} onClick={handleSimulate} variant="secondary">
                {isSimulating ? 'Simulando...' : 'Simular credito'}
              </Button>
            }
            description="Selecciona cliente, producto, monto y cuotas."
            title="Solicitud de credito"
          />
          <CardBody>
            <form className="form-grid">
              <div className="field">
                <label htmlFor="client">Cliente</label>
                <div className="combobox">
                  <input
                    aria-autocomplete="list"
                    aria-expanded={isClientComboboxOpen}
                    aria-controls="client-options"
                    id="client"
                    onBlur={() => window.setTimeout(() => setIsClientComboboxOpen(false), 120)}
                    onChange={(event) => handleChange('clientSearch', event.target.value)}
                    onFocus={() => setIsClientComboboxOpen(true)}
                    placeholder={isLoading ? 'Cargando clientes...' : 'Buscar por DNI o nombre'}
                    role="combobox"
                    value={form.clientSearch}
                  />
                  {selectedClient ? <Badge color="blue">Cliente seleccionado</Badge> : null}
                  {isClientComboboxOpen ? (
                    <div className="combobox__panel" id="client-options" role="listbox">
                      {filteredClients.length ? (
                        filteredClients.map((client) => (
                          <button
                            className="combobox__option"
                            key={client.id}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectClient(client.id, `${client.fullName} - ${client.dni}`)}
                            role="option"
                            type="button"
                          >
                            <strong>{client.fullName}</strong>
                            <span>{client.dni}</span>
                          </button>
                        ))
                      ) : (
                        <div className="combobox__empty">No hay clientes para esa busqueda</div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="field">
                <label htmlFor="product">Producto</label>
                <select
                  id="product"
                  onChange={(event) => handleProductChange(event.target.value as CreditProductType)}
                  value={form.productType}
                >
                  {creditProductOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="amount">Monto solicitado</label>
                <input
                  id="amount"
                  min="0"
                  onChange={(event) => handleChange('amount', event.target.value)}
                  placeholder="S/ 0.00"
                  step="1"
                  type="number"
                  value={form.amount}
                />
              </div>
              <div className="field">
                <label htmlFor="installments">Cuotas</label>
                <input
                  id="installments"
                  min="1"
                  onChange={(event) => handleChange('installments', event.target.value)}
                  placeholder="6"
                  step="1"
                  type="number"
                  value={form.installments}
                />
              </div>
              <div className="field">
                <label htmlFor="paymentFrequency">Frecuencia de pago</label>
                <select
                  id="paymentFrequency"
                  onChange={(event) => handleChange('paymentFrequency', event.target.value as PaymentFrequency)}
                  value={form.paymentFrequency}
                >
                  {paymentFrequencyOptions.map((frequency) => (
                    <option key={frequency.id} value={frequency.id}>
                      {frequency.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="notes">Observaciones</label>
                <textarea id="notes" onChange={(event) => handleChange('notes', event.target.value)} value={form.notes} />
              </div>
              <div className="field">
                <label htmlFor="files">Archivos</label>
                <input id="files" multiple onChange={(event) => handleFilesChange(event.target.files)} type="file" />
                <span className={form.files.length > maxRequestFiles ? 'message--error' : undefined}>
                  {form.files.length} de {maxRequestFiles} archivos
                </span>
              </div>
              {form.files.length ? (
                <div className="field">
                  <label>Seleccionados</label>
                  <div className="list">
                    {form.files.map((file) => (
                      <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </form>
          </CardBody>
        </Card>
        {simulation ? (
          <Card>
            <CardHeader
              description={`Total ${formatMoney(simulation.totalAmount)} - cuota ${formatMoney(simulation.installmentAmount)}`}
              title="Cronograma de pagos"
            />
            <CardBody>
              <div className="list">
                <article className="list-item">
                  <div>
                    <strong>Tasa mensual</strong>
                    <span>{formatPercentage(simulation.interestRate)}</span>
                  </div>
                  <Badge color="blue">{simulation.installments.length} cuotas</Badge>
                  <Badge color="gray">{getPaymentFrequencyLabel(simulation.paymentFrequency)}</Badge>
                </article>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cuota</th>
                      <th>Vence</th>
                      <th>Capital</th>
                      <th>Interes</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.installments.map((installment) => (
                      <tr key={installment.installmentNo}>
                        <td>{installment.installmentNo}</td>
                        <td>{installment.dueDate}</td>
                        <td className="money">{formatMoney(installment.principal)}</td>
                        <td className="money">{formatMoney(installment.interest)}</td>
                        <td className="money">{formatMoney(installment.totalDue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader description="Productos disponibles" title="Politicas activas" />
            <CardBody>
              <div className="list">
                {creditProductOptions.map((product) => (
                  <article className="list-item" key={product.id}>
                    <div>
                      <strong>{product.label}</strong>
                      <span>{getProductDescription(product)}</span>
                    </div>
                    <div className="actions">
                      <Badge color={product.requiresGuarantee ? 'yellow' : 'blue'}>
                        {product.defaultInstallments} cuotas
                      </Badge>
                      <Badge color="gray">Segun evaluacion</Badge>
                    </div>
                  </article>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </section>
    </>
  );
};

const printPaymentSchedule = (credit: RegisteredCredit) => {
  const printWindow = window.open('', '_blank', 'width=860,height=720');

  if (!printWindow) return false;

  const clientName = escapePrintHtml(`${credit.client.firstName} ${credit.client.lastName}`);
  const creditCode = escapePrintHtml(credit.code);
  const creditStatus = escapePrintHtml(credit.status);
  const rows = credit.schedules
    .map((schedule) => {
      const dueDate = new Date(schedule.dueDate).toLocaleDateString('es-PE');

      return `
        <tr>
          <td>${schedule.installmentNo}</td>
          <td>${dueDate}</td>
          <td>${formatMoney(schedule.principal)}</td>
          <td>${formatMoney(schedule.interest)}</td>
          <td>${formatMoney(schedule.totalDue)}</td>
        </tr>
      `;
    })
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Cronograma ${creditCode}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
          h1 { font-size: 22px; margin: 20px 0 8px; }
          p { margin: 4px 0; }
          ${getPrintBrandStyles()}
          table { border-collapse: collapse; margin-top: 18px; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
          th { background: #f3f4f6; }
          th:first-child, td:first-child, th:nth-child(2), td:nth-child(2) { text-align: left; }
          .summary { margin-top: 16px; }
          .total { font-size: 18px; font-weight: 700; margin-top: 12px; }
          .signatures { display: grid; gap: 56px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 72px; page-break-inside: avoid; text-align: center; }
          .signature { border-top: 1px solid #111827; padding-top: 6px; }
          @media print {
            body { padding: 0; }
            th { background: transparent; }
          }
        </style>
      </head>
      <body>
        ${getPrintBrandMarkup(window.location.origin)}
        <h1>Cronograma de pagos</h1>
        <p><strong>Credito:</strong> ${creditCode}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Estado:</strong> ${creditStatus}</p>
        <div class="summary">
          <p><strong>Monto:</strong> ${formatMoney(credit.principalAmount)}</p>
          <p><strong>Tasa mensual:</strong> ${formatPercentage(credit.interestRate)}</p>
          <p><strong>Frecuencia:</strong> ${getPaymentFrequencyLabel(credit.paymentFrequency)}</p>
          <p><strong>Cuota:</strong> ${formatMoney(credit.installmentAmount)}</p>
          <p class="total">Total: ${formatMoney(credit.totalAmount)}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Vence</th>
              <th>Capital</th>
              <th>Interes</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
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
  return true;
};

const getPaymentFrequencyLabel = (paymentFrequency: PaymentFrequency) => {
  if (paymentFrequency === 'DAILY') return 'Diario';
  if (paymentFrequency === 'WEEKLY') return 'Semanal';
  return 'Mensual';
};
