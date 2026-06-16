import React, { useEffect, useState } from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { hasRole, useAuth } from '../../common/auth/AuthProvider';
import { formatDueDate, formatMoney, formatPercentage } from '../../common/lib/format';
import { escapePrintHtml, getPrintBrandMarkup, getPrintBrandStyles, printDocument } from '../../common/lib/print';
import { PageHeader } from '../../common/layout/PageHeader';
import { clientStatusOptions, initialClientFilters, initialClientForm } from './data';
import { useClientCredits, useClients } from './hooks';
import { filterClients, getClientRiskColor, getClientRiskLabel, toClientFormState } from './lib';
import { printApprovedPaymentSchedule, printCreditContract, printDisbursementRequest } from '../solicitudes/lib';
import type { CreditContractData } from '../solicitudes/types';
import type { Client, ClientCredit, ClientFilters, ClientFormState, PaymentVoucher } from './types';

const emptyPaymentVoucher: PaymentVoucher = {
  amount: 0,
  cashierName: '',
  clientDni: '',
  clientName: '',
  creditCode: '',
  paidAt: '',
  remainingBalance: 0,
  scheduleNumbers: [],
  voucherCode: '',
};

export const ClientesView: React.FC = () => {
  const { user } = useAuth();
  const canAssignCreditAdvisor = hasRole(user, ['ADMIN']);
  const canUseCashSessions = hasRole(user, ['ADMIN', 'CASHIER']);
  const { clients, createClient, error, isCreating, isLoading, isUpdating, refetch, updateClient } = useClients();
  const {
    advisors,
    assignAdvisor,
    credits,
    disbursement,
    disburseCredit,
    error: creditsError,
    fetchCredits,
    isDisbursing,
    isAssigningAdvisor,
    isLoading: isLoadingCredits,
    isPaying,
    openCashSessions,
    payInstallments,
    voucher: paidVoucherPreview,
  } = useClientCredits(canAssignCreditAdvisor, canUseCashSessions);
  const voucher = paidVoucherPreview ?? emptyPaymentVoucher;
  const [form, setForm] = useState<ClientFormState>(initialClientForm);
  const [filters, setFilters] = useState<ClientFilters>(initialClientFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const isEditMode = Boolean(selectedClient);

  useEffect(() => {
    if (!credits?.length) {
      setSelectedCreditId(null);
      return;
    }

    setSelectedCreditId((currentId) => {
      if (currentId && credits.some((credit) => credit.id === currentId)) return currentId;
      return credits[0].id;
    });
  }, [credits]);

  const selectedCredit = credits?.find((credit) => credit.id === selectedCreditId) ?? null;
  const parsedPaymentAmount = Number(paymentAmount);
  const isPaymentAmountValid = Number.isFinite(parsedPaymentAmount) && parsedPaymentAmount > 0;
  const canPayInstallments = canUseCashSessions;
  const canDisburseCredits = canUseCashSessions;
  const canPrintClientCreditDocuments = canUseCashSessions;
  const ownOpenCashSession = user ? openCashSessions?.find((session) => session.userId === user.id) ?? null : null;
  const isSelectedCreditDisbursed = selectedCredit?.status === 'ACTIVE' || selectedCredit?.status === 'OVERDUE';

  const handleChange = (field: keyof ClientFormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleFilterChange = (field: keyof ClientFilters, value: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const handleCreateClick = () => {
    setSelectedClient(null);
    setSelectedCreditId(null);
    setSelectedScheduleId(null);
    setPaymentAmount('');
    setForm(initialClientForm);
    setIsFormOpen(true);
  };

  const handleEditClick = () => {
    if (!selectedClient) return;

    setForm(toClientFormState(selectedClient));
    setIsFormOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSelectedCreditId(null);
    setSelectedScheduleId(null);
    setPaymentAmount('');
    void fetchCredits(client.id);
  };

  const handlePayInstallments = async () => {
    if (!canPayInstallments) return;
    if (!selectedCredit) return;
    if (!user) return;
    if (!isPaymentAmountValid) return;
    if (!isSelectedCreditDisbursed) return;

    const paidVoucher = await payInstallments(selectedCredit.id, parsedPaymentAmount, user.id);

    if (!paidVoucher) return;
    setSelectedScheduleId(null);
    setPaymentAmount('');
    printVoucher(paidVoucher);
  };

  const handleDisburseCredit = async (creditId: string) => {
    if (!canDisburseCredits) return;
    if (!user) return;

    await disburseCredit(creditId, user.id);
  };

  const handlePrintApprovedDocument = (printDocumentHandler: (printWindow: Window, contract: CreditContractData) => void) => {
    if (!selectedClient) return;
    if (!selectedCredit) return;
    if (selectedCredit.status !== 'APPROVED') return;

    const printWindow = window.open('', '_blank', 'width=960,height=760');

    if (!printWindow) return;
    printDocumentHandler(printWindow, toCreditContractData(selectedClient, selectedCredit));
  };

  const getSubmitLabel = () => {
    if (isUpdating) return 'Actualizando...';
    if (isCreating) return 'Guardando...';
    if (isEditMode) return 'Actualizar cliente';
    return 'Guardar cliente';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedClient) {
      const updated = await updateClient(selectedClient.id, form);

      if (!updated) return;

      setSelectedClient(null);
      setSelectedCreditId(null);
      setSelectedScheduleId(null);
      setPaymentAmount('');
      setForm(initialClientForm);
      setIsFormOpen(false);
      return;
    }

    const created = await createClient(form);

    if (!created) return;

    setForm(initialClientForm);
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          actions={<Button variant="outline">Cargando</Button>}
          description="Consulta clientes, deuda vigente, estado de riesgo y datos de contacto."
          title="Clientes"
        />
        <div className="card">
          <div className="card__body">Cargando clientes...</div>
        </div>
      </>
    );
  }

  if (error && !clients) {
    return (
      <>
        <PageHeader
          actions={<Button onClick={() => void refetch()}>Reintentar</Button>}
          description="Consulta clientes, deuda vigente, estado de riesgo y datos de contacto."
          title="Clientes"
        />
        <div className="card">
          <div className="card__body message--error">{error}</div>
        </div>
      </>
    );
  }

  if (!clients?.length) {
    return (
      <>
        <PageHeader
          actions={<Button onClick={handleCreateClick}>Nuevo cliente</Button>}
          description="Consulta clientes, deuda vigente, estado de riesgo y datos de contacto."
          title="Clientes"
        />
        <div className="card">
          <div className="card__body">No hay clientes registrados.</div>
        </div>
      </>
    );
  }

  const filteredClients = filterClients(clients, filters);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button onClick={isFormOpen ? () => setIsFormOpen(false) : handleCreateClick} variant="outline">
              {isFormOpen ? 'Cerrar formulario' : 'Nuevo cliente'}
            </Button>
            <Button disabled={!selectedClient} onClick={handleEditClick} variant="secondary">
              Actualizar
            </Button>
            <Button onClick={() => void refetch({ silent: true })} variant="ghost">
              Recargar
            </Button>
          </>
        }
        description="Consulta clientes, deuda vigente, estado de riesgo y datos de contacto."
        title="Clientes"
      />
      {error ? (
        <div className="card">
          <div className="card__body message--error">{error}</div>
        </div>
      ) : null}
      {isFormOpen ? (
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{isEditMode ? 'Actualizar cliente' : 'Registrar cliente'}</h2>
              <p className="card__description">
                {isEditMode ? 'Edita el cliente seleccionado y guarda los cambios.' : 'Los datos se guardan en PostgreSQL mediante el backend.'}
              </p>
            </div>
          </div>
          <div className="card__body">
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="firstName">Nombre</label>
                <input id="firstName" onChange={(event) => handleChange('firstName', event.target.value)} required value={form.firstName} />
              </div>
              <div className="field">
                <label htmlFor="lastName">Apellido</label>
                <input id="lastName" onChange={(event) => handleChange('lastName', event.target.value)} required value={form.lastName} />
              </div>
              <div className="field">
                <label htmlFor="dni">DNI</label>
                <input id="dni" maxLength={8} onChange={(event) => handleChange('dni', event.target.value)} required value={form.dni} />
              </div>
              <div className="field">
                <label htmlFor="phone">Telefono</label>
                <input id="phone" onChange={(event) => handleChange('phone', event.target.value)} required value={form.phone} />
              </div>
              <div className="field">
                <label htmlFor="birthDate">Fecha de nacimiento</label>
                <input id="birthDate" onChange={(event) => handleChange('birthDate', event.target.value)} type="date" value={form.birthDate} />
              </div>
              <div className="field">
                <label htmlFor="email">Correo</label>
                <input id="email" onChange={(event) => handleChange('email', event.target.value)} type="email" value={form.email} />
              </div>
              <div className="field">
                <label htmlFor="personalAddress">Direccion personal</label>
                <input id="personalAddress" onChange={(event) => handleChange('personalAddress', event.target.value)} value={form.personalAddress} />
              </div>
              <div className="field">
                <label htmlFor="businessAddress">Direccion del negocio</label>
                <input id="businessAddress" onChange={(event) => handleChange('businessAddress', event.target.value)} value={form.businessAddress} />
              </div>
              <div className="field">
                <label htmlFor="status">Estado</label>
                <select id="status" onChange={(event) => handleChange('status', event.target.value)} value={form.status}>
                  {clientStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="actions">
                <Button disabled={isCreating || isUpdating} type="submit">
                  {getSubmitLabel()}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      <div className="card">
        <div className="card__body">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="filterName">Filtrar por nombre</label>
              <input id="filterName" onChange={(event) => handleFilterChange('name', event.target.value)} placeholder="Nombre o apellido" value={filters.name} />
            </div>
            <div className="field">
              <label htmlFor="filterDni">Filtrar por DNI</label>
              <input id="filterDni" maxLength={8} onChange={(event) => handleFilterChange('dni', event.target.value)} placeholder="DNI" value={filters.dni} />
            </div>
          </div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>DNI</th>
              <th>Telefono</th>
              <th>Nacimiento</th>
              <th>Direccion personal</th>
              <th>Direccion negocio</th>
              <th>Deuda</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr className={selectedClient?.id === client.id ? 'table__row--selected' : undefined} key={client.id} onClick={() => handleSelectClient(client)}>
                <td>{client.fullName}</td>
                <td>{client.dni}</td>
                <td>{client.phone}</td>
                <td>{client.birthDate ?? '-'}</td>
                <td>{client.personalAddress ?? '-'}</td>
                <td>{client.businessAddress ?? '-'}</td>
                <td className="money">{formatMoney(client.totalDebt)}</td>
                <td>
                  <Badge color={getClientRiskColor(client)}>{getClientRiskLabel(client)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filteredClients.length ? (
        <div className="card">
          <div className="card__body">No hay clientes que coincidan con los filtros.</div>
        </div>
      ) : null}
      {selectedClient ? (
        <section className="grid">
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Creditos de {selectedClient.fullName}</h2>
                <p className="card__description">Selecciona credito para ver cuotas.</p>
              </div>
            </div>
            <div className="card__body">
              {creditsError ? <p className="message--error">{creditsError}</p> : null}
              {disbursement ? (
                <p>
                  Credito {disbursement.creditCode} desembolsado desde {disbursement.cashBox}: {formatMoney(disbursement.amount)}
                </p>
              ) : null}
              {isLoadingCredits ? <p>Cargando creditos...</p> : null}
              {!isLoadingCredits && !credits?.length ? <p>No hay creditos aprobados.</p> : null}
              {credits?.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Monto credito</th>
                        <th>Interes</th>
                        <th>Mora</th>
                        <th>Valor neto</th>
                        <th>Estado</th>
                        <th>Asesor</th>
                        <th>Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credits.map((credit) => (
                        <tr
                          className={selectedCreditId === credit.id ? 'table__row--selected' : undefined}
                          key={credit.id}
                          onClick={() => {
                            setSelectedCreditId(credit.id);
                            setSelectedScheduleId(null);
                            setPaymentAmount('');
                          }}
                        >
                          <td>{credit.code}</td>
                          <td className="money">{formatMoney(credit.principalAmount)}</td>
                          <td>{formatPercentage(credit.interestRate)}</td>
                          <td className="money">{formatMoney(credit.overdueAmount)}</td>
                          <td className="money">{formatMoney(credit.netValue)}</td>
                          <td>{credit.status}</td>
                          <td onClick={(event) => event.stopPropagation()}>
                            {canAssignCreditAdvisor && advisors?.length ? (
                              <select
                                aria-label={`Asesor de ${credit.code}`}
                                disabled={isAssigningAdvisor}
                                onChange={(event) => void assignAdvisor(credit.id, event.target.value)}
                                value={credit.advisorId}
                              >
                                {advisors.map((advisor) => (
                                  <option key={advisor.id} value={advisor.id}>
                                    {advisor.fullName}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              credit.advisorName
                            )}
                          </td>
                          <td onClick={(event) => event.stopPropagation()}>
                            {credit.status === 'APPROVED' && canDisburseCredits ? (
                              <Button
                                className="button--compact"
                                disabled={!canDisburseCredits || !ownOpenCashSession || isDisbursing}
                                onClick={() => void handleDisburseCredit(credit.id)}
                              >
                                Desembolsar
                              </Button>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Detalle de cuotas</h2>
                <p className="card__description">{selectedCredit ? selectedCredit.code : 'Sin credito seleccionado'}</p>
              </div>
            </div>
            <div className="card__body">
              {selectedCredit?.status === 'APPROVED' && canPrintClientCreditDocuments ? (
                <div className="actions">
                  <Button className="button--compact button--document" onClick={() => handlePrintApprovedDocument(printApprovedPaymentSchedule)} variant="outline">
                    Cronograma
                  </Button>
                  <Button className="button--compact button--document" onClick={() => handlePrintApprovedDocument(printCreditContract)} variant="outline">
                    Contrato
                  </Button>
                  <Button className="button--compact button--document" onClick={() => handlePrintApprovedDocument(printDisbursementRequest)} variant="outline">
                    Solicitud de desembolso
                  </Button>
                </div>
              ) : null}
              {voucher && false ? (
                <div className="voucher">
                  <div>
                    <strong>{voucher.voucherCode}</strong>
                    <span>
                      {voucher.creditCode} · cuotas {voucher.scheduleNumbers.join(', ')} · saldo {formatMoney(voucher.remainingBalance)}
                    </span>
                  </div>
                  <Button className="button--compact" onClick={() => printVoucher(voucher)} variant="outline">
                    Imprimir
                  </Button>
                </div>
              ) : null}
              {selectedCredit && canPayInstallments && !isSelectedCreditDisbursed ? <p className="message--error">Credito debe estar desembolsado para registrar pagos.</p> : null}
              {selectedCredit && canPayInstallments && !ownOpenCashSession ? <p className="message--error">Perfil debe tener una caja abierta para registrar pagos.</p> : null}
              {selectedCredit && canPayInstallments && isSelectedCreditDisbursed && ownOpenCashSession ? (
                <div className="inline-form">
                  <div className="field">
                    <label htmlFor="paymentAmount">Monto a pagar</label>
                    <input
                      id="paymentAmount"
                      min="0.01"
                      onChange={(event) => {
                        setSelectedScheduleId(null);
                        setPaymentAmount(event.target.value);
                      }}
                      placeholder="S/ 0.00"
                      step="0.01"
                      type="number"
                      value={paymentAmount}
                    />
                  </div>
                  <Button disabled={!isPaymentAmountValid || isPaying} onClick={() => void handlePayInstallments()}>
                    {isPaying ? 'Pagando...' : 'Pagar'}
                  </Button>
                </div>
              ) : null}
              {selectedCredit ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Cuota</th>
                        <th>Vence</th>
                        <th>Capital</th>
                        <th>Interes</th>
                        <th>Mora</th>
                        <th>Total</th>
                        <th>Pagado</th>
                        <th>Saldo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCredit.schedules.map((schedule) => {
                        const pendingAmount = Math.max(0, schedule.totalDue + schedule.penalty - schedule.paidAmount);

                        return (
                          <tr
                            className={selectedScheduleId === schedule.id ? 'table__row--selected' : undefined}
                            key={schedule.id}
                            onClick={() => {
                              if (!canPayInstallments || !ownOpenCashSession || !isSelectedCreditDisbursed || pendingAmount <= 0) return;
                              setSelectedScheduleId(schedule.id);
                              setPaymentAmount(pendingAmount.toFixed(2));
                            }}
                          >
                            <td>{schedule.installmentNo}</td>
                            <td>{formatDueDate(schedule.dueDate)}</td>
                            <td className="money">{formatMoney(schedule.principal)}</td>
                            <td className="money">{formatMoney(schedule.interest)}</td>
                            <td className="money">{formatMoney(schedule.penalty)}</td>
                            <td className="money">{formatMoney(schedule.totalDue)}</td>
                            <td className="money">{formatMoney(schedule.paidAmount)}</td>
                            <td className="money">{formatMoney(pendingAmount)}</td>
                            <td>{schedule.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Selecciona un credito.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};

const toCreditContractData = (client: Client, credit: ClientCredit): CreditContractData => ({
  advisorName: credit.advisorName,
  approvedAt: credit.approvedAt,
  approvedByName: credit.approvedByName ?? credit.advisorName,
  clientAddress: client.personalAddress,
  clientDni: client.dni,
  clientName: client.fullName,
  creditCode: credit.code,
  installmentAmount: credit.installmentAmount,
  installmentCount: credit.schedules.length,
  interestRate: credit.interestRate,
  penaltyRate: credit.penaltyRate,
  principalAmount: credit.principalAmount,
  schedules: credit.schedules.map((schedule) => ({
    dueDate: schedule.dueDate,
    installmentNo: schedule.installmentNo,
    interest: schedule.interest,
    principal: schedule.principal,
    totalDue: schedule.totalDue,
  })),
  totalAmount: credit.totalAmount,
});

const printVoucher = (voucher: PaymentVoucher) => {
  const printWindow = window.open('', '_blank', 'width=960,height=680');

  if (!printWindow) return;

  const cashierName = escapePrintHtml(voucher.cashierName);
  const clientDni = escapePrintHtml(voucher.clientDni);
  const clientName = escapePrintHtml(voucher.clientName);
  const creditCode = escapePrintHtml(voucher.creditCode);
  const voucherCode = escapePrintHtml(voucher.voucherCode);
  const paidAt = new Date(voucher.paidAt).toLocaleString('es-PE');
  const voucherCopy = (includeSignature: boolean) => `
    <section class="voucher-copy">
      ${getPrintBrandMarkup(window.location.origin)}
      <h1>Voucher de pago</h1>
      <p><span>Fecha</span><strong>${paidAt}</strong></p>
      <p><span>Cliente</span><strong>${clientName}</strong></p>
      <p><span>Cuotas</span><strong>${voucher.scheduleNumbers.join(', ')}</strong></p>
      <p><span>Codigo</span><strong>${voucherCode}</strong></p>
      <p><span>Credito</span><strong>${creditCode}</strong></p>
      <p class="amount"><span>Total</span><strong>${formatMoney(voucher.amount)}</strong></p>
      <p><span>Saldo pendiente</span><strong>${formatMoney(voucher.remainingBalance)}</strong></p>
      ${includeSignature ? '<div class="signature"><span>Firma</span></div>' : ''}
      <p><span>DNI</span><strong>${clientDni}</strong></p>
      <footer><span>Usuario</span><strong>${cashierName}</strong></footer>
    </section>
  `;

  printWindow.document.write(`
    <html>
      <head>
        <title>${voucherCode}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #111; }
          .voucher-sheet { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .voucher-copy { display: flex; min-height: 560px; flex-direction: column; padding: 0 22px; }
          .voucher-copy + .voucher-copy { border-left: 1px dashed #777; }
          h1 { font-size: 19px; margin: 16px 0 14px; text-align: center; }
          p { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px; margin: 5px 0; font-size: 13px; }
          p span, footer span { color: #4b5563; }
          p strong { overflow-wrap: anywhere; }
          ${getPrintBrandStyles()}
          .amount { border-top: 1px solid #aaa; margin-top: 12px; padding-top: 10px; font-size: 17px; }
          .signature { height: 82px; margin-top: 18px; border-bottom: 1px solid #111; display: flex; align-items: end; justify-content: center; }
          .signature span { position: relative; top: 20px; font-size: 11px; }
          footer { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px; margin-top: auto; border-top: 1px solid #aaa; padding-top: 8px; font-size: 11px; }
          @media print { body { padding: 0; } .voucher-copy { min-height: 95vh; } }
        </style>
      </head>
      <body>
        <main class="voucher-sheet">
          ${voucherCopy(true)}
          ${voucherCopy(false)}
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printDocument(printWindow);
};
