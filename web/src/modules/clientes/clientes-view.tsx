import React, { useEffect, useState } from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { hasRole, useAuth } from '../../common/auth/AuthProvider';
import { formatDueDate, formatMoney, formatPercentage } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { clientStatusOptions, initialClientFilters, initialClientForm } from './data';
import { useClientCredits, useClients } from './hooks';
import { filterClients, getClientRiskColor, getClientRiskLabel, toClientFormState } from './lib';
import type { Client, ClientFilters, ClientFormState, PaymentVoucher } from './types';

export const ClientesView: React.FC = () => {
  const { user } = useAuth();
  const { clients, createClient, error, isCreating, isLoading, isUpdating, refetch, updateClient } = useClients();
  const {
    credits,
    error: creditsError,
    fetchCredits,
    isLoading: isLoadingCredits,
    isPaying,
    payInstallments,
    voucher,
  } = useClientCredits();
  const [form, setForm] = useState<ClientFormState>(initialClientForm);
  const [filters, setFilters] = useState<ClientFilters>(initialClientFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<Record<string, string[]>>({});
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
  const selectedIds = selectedCredit ? selectedScheduleIds[selectedCredit.id] ?? [] : [];
  const canPayInstallments = hasRole(user, ['ADMIN', 'CASHIER']);

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
    setSelectedScheduleIds({});
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
    setSelectedScheduleIds({});
    void fetchCredits(client.id);
  };

  const handleScheduleToggle = (creditId: string, scheduleId: string, checked: boolean) => {
    if (!canPayInstallments) return;

    setSelectedScheduleIds((currentValue) => {
      const currentIds = currentValue[creditId] ?? [];
      const nextIds = checked ? [...currentIds, scheduleId] : currentIds.filter((id) => id !== scheduleId);

      return {
        ...currentValue,
        [creditId]: nextIds,
      };
    });
  };

  const handlePayInstallments = async () => {
    if (!canPayInstallments) return;
    if (!selectedCredit) return;

    const paid = await payInstallments(selectedCredit.id, selectedIds);

    if (!paid) return;

    setSelectedScheduleIds((currentValue) => ({
      ...currentValue,
      [selectedCredit.id]: [],
    }));
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
      setSelectedScheduleIds({});
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
        <section className="grid grid--two">
          <div className="card">
            <div className="card__header">
              <div>
                <h2 className="card__title">Creditos de {selectedClient.fullName}</h2>
                <p className="card__description">Selecciona credito para ver cuotas.</p>
              </div>
            </div>
            <div className="card__body">
              {creditsError ? <p className="message--error">{creditsError}</p> : null}
              {isLoadingCredits ? <p>Cargando creditos...</p> : null}
              {!isLoadingCredits && !credits?.length ? <p>No hay creditos aprobados.</p> : null}
              {credits?.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Total</th>
                        <th>Interes</th>
                        <th>Mora</th>
                        <th>Valor neto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credits.map((credit) => (
                        <tr
                          className={selectedCreditId === credit.id ? 'table__row--selected' : undefined}
                          key={credit.id}
                          onClick={() => {
                            setSelectedCreditId(credit.id);
                            setSelectedScheduleIds((currentValue) => ({
                              ...currentValue,
                              [credit.id]: [],
                            }));
                          }}
                        >
                          <td>{credit.code}</td>
                          <td className="money">{formatMoney(credit.totalAmount)}</td>
                          <td>{formatPercentage(credit.interestRate)}</td>
                          <td className="money">{formatMoney(credit.overdueAmount)}</td>
                          <td className="money">{formatMoney(credit.netValue)}</td>
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
              <Button className="button--compact" disabled={!canPayInstallments || !selectedIds.length || isPaying} onClick={() => void handlePayInstallments()}>
                Pagar
              </Button>
            </div>
            <div className="card__body">
              {voucher ? (
                <div className="voucher">
                  <div>
                    <strong>{voucher.voucherCode}</strong>
                    <span>
                      {voucher.creditCode} · cuotas {voucher.scheduleNumbers.join(', ')} · {formatMoney(voucher.amount)}
                    </span>
                  </div>
                  <Button className="button--compact" onClick={() => printVoucher(voucher)} variant="outline">
                    Imprimir
                  </Button>
                </div>
              ) : null}
              {!canPayInstallments ? <p className="message--error">No autorizado para pagar cuotas.</p> : null}
              {selectedCredit ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Pagar</th>
                        <th>Cuota</th>
                        <th>Vence</th>
                        <th>Capital</th>
                        <th>Interes</th>
                        <th>Mora</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCredit.schedules.map((schedule) => {
                        const isPaid = schedule.status === 'PAID';

                        return (
                          <tr key={schedule.id}>
                            <td>
                              <input
                                checked={selectedIds.includes(schedule.id)}
                                disabled={isPaid || !canPayInstallments}
                                onChange={(event) => handleScheduleToggle(selectedCredit.id, schedule.id, event.target.checked)}
                                type="checkbox"
                              />
                            </td>
                            <td>{schedule.installmentNo}</td>
                            <td>{formatDueDate(schedule.dueDate)}</td>
                            <td className="money">{formatMoney(schedule.principal)}</td>
                            <td className="money">{formatMoney(schedule.interest)}</td>
                            <td className="money">{formatMoney(schedule.penalty)}</td>
                            <td className="money">{formatMoney(schedule.totalDue)}</td>
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

const printVoucher = (voucher: PaymentVoucher) => {
  const printWindow = window.open('', '_blank', 'width=420,height=620');

  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${voucher.voucherCode}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; margin: 0 0 16px; }
          p { margin: 8px 0; }
          .amount { font-size: 24px; font-weight: 700; margin-top: 18px; }
        </style>
      </head>
      <body>
        <h1>Voucher de pago</h1>
        <p><strong>Codigo:</strong> ${voucher.voucherCode}</p>
        <p><strong>Cliente:</strong> ${voucher.clientName}</p>
        <p><strong>Credito:</strong> ${voucher.creditCode}</p>
        <p><strong>Cuotas:</strong> ${voucher.scheduleNumbers.join(', ')}</p>
        <p><strong>Fecha:</strong> ${new Date(voucher.paidAt).toLocaleString('es-PE')}</p>
        <p class="amount">Total: ${formatMoney(voucher.amount)}</p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
