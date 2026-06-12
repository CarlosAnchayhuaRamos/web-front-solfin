import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { useAuth } from '../../common/auth/AuthProvider';
import { formatMoney } from '../../common/lib/format';
import { escapePrintHtml, getPrintBrandMarkup, getPrintBrandStyles, printDocument } from '../../common/lib/print';
import { PageHeader } from '../../common/layout/PageHeader';
import { useCashPolicy } from '../parametros/hooks';
import { currencyDenominations } from './data';
import { useCashSessions } from './hooks';
import { getCashDifference, getDenominationCounts, getDenominationSummary, getDenominationTotal } from './lib';
import type { CashCloseReport, VaultCloseReport } from './types';

const initialQuantities = Object.fromEntries(currencyDenominations.map((denomination) => [denomination.label, '0']));

export const AperturaCierreView: React.FC = () => {
  const { user } = useAuth();
  const { cashPolicy } = useCashPolicy();
  const cash = useCashSessions();
  const [newCashBoxName, setNewCashBoxName] = useState('');
  const [selectedCashBox, setSelectedCashBox] = useState('');
  const [balanceAmounts, setBalanceAmounts] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>(initialQuantities);

  const maxCashDifference = cashPolicy?.maxCashDifference ?? 0.5;
  const maxCashBoxBalance = cashPolicy?.maxCashBoxBalance ?? 15000;
  const denominationTotal = useMemo(() => getDenominationTotal(currencyDenominations, quantities), [quantities]);
  const exceedsCashLimit = denominationTotal > maxCashBoxBalance;
  const isAdmin = user?.role === 'ADMIN';
  const isCashier = user?.role === 'CASHIER';
  const assignedCashBoxes = useMemo(() => {
    if (!user) return [];
    return (cash.boxes ?? []).filter((box) => box.assignedCashierId === user.id);
  }, [cash.boxes, user]);
  const selectedOpenSession = cash.sessions?.find((session) => session.cashBox === selectedCashBox && session.status === 'OPEN') ?? null;
  const isClosingMode = Boolean(selectedOpenSession);
  const closingDifference = selectedOpenSession ? denominationTotal - selectedOpenSession.expectedAmount : 0;
  const canOpenCashBox = isCashier && selectedCashBox !== '' && cash.isVaultOpen && !isClosingMode && !exceedsCashLimit && !cash.isSaving;
  const canCloseCashBox = isCashier && isClosingMode && Math.abs(closingDifference) <= maxCashDifference && !cash.isSaving;

  useEffect(() => {
    if (!assignedCashBoxes.length) return;
    if (selectedCashBox) return;
    setSelectedCashBox(assignedCashBoxes[0].name);
  }, [assignedCashBoxes, selectedCashBox]);

  const handleQuantityChange = (label: string, value: string) => {
    setQuantities((currentQuantities) => ({
      ...currentQuantities,
      [label]: value,
    }));
  };

  const handleToggleVault = async () => {
    if (cash.isVaultOpen) {
      const reportWindow = window.open('', '_blank', 'width=900,height=760');
      const report = await cash.closeVault();
      if (!report) {
        reportWindow?.close();
        return;
      }

      printVaultCloseReport(report, reportWindow);
      return;
    }

    await cash.openVault();
  };

  const handleCreateCashBox = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const created = await cash.createCashBox(newCashBoxName);
    if (!created) return;
    setNewCashBoxName('');
  };

  const handleAssignCashBox = (boxId: string, cashierId: string) => {
    if (!cashierId) return;
    void cash.assignCashBox(boxId, cashierId);
  };

  const handleAddBalance = async (sessionId: string) => {
    if (!user) return;

    const amount = Number(balanceAmounts[sessionId] ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const saved = await cash.addCashSessionBalance(sessionId, amount, user.id);
    if (!saved) return;

    setBalanceAmounts((currentAmounts) => ({ ...currentAmounts, [sessionId]: '' }));
  };

  const handleOpenCashBox = async () => {
    if (!canOpenCashBox) return;
    if (!user) return;

    const saved = await cash.openCashSession(
      selectedCashBox,
      denominationTotal,
      getDenominationCounts(currencyDenominations, quantities),
      { fullName: user.fullName, id: user.id },
    );
    if (!saved) return;
    setQuantities(initialQuantities);
  };

  const handleCloseCashBox = async () => {
    if (!selectedOpenSession) return;
    if (!canCloseCashBox) return;

    const reportWindow = window.open('', '_blank', 'width=760,height=720');
    const closed = await cash.closeCashSession(
      selectedOpenSession.id,
      denominationTotal,
      getDenominationCounts(currencyDenominations, quantities),
    );

    if (!closed) {
      reportWindow?.close();
      return;
    }

    setQuantities(initialQuantities);
    printCashCloseReport(closed, reportWindow);
  };

  if (cash.isLoading) {
    return (
      <>
        <PageHeader
          actions={<Button variant="outline">Cargando</Button>}
          description="Monitorea la apertura, movimientos y cierre diario de caja y boveda."
          title="Apertura cierre"
        />
        <Card>
          <CardBody>Cargando apertura y cierre...</CardBody>
        </Card>
      </>
    );
  }

  if (cash.error && !cash.sessions) {
    return (
      <>
        <PageHeader
          actions={<Button onClick={() => void cash.refetch()}>Reintentar</Button>}
          description="Monitorea la apertura, movimientos y cierre diario de caja y boveda."
          title="Apertura cierre"
        />
        <Card>
          <CardBody className="message--error">{cash.error}</CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <Badge color={cash.isVaultOpen ? 'black' : 'yellow'}>
            {cash.isVaultOpen ? 'Boveda abierta' : 'Boveda pendiente'}
          </Badge>
        }
        description="Monitorea la apertura, movimientos y cierre diario de caja y boveda."
        title="Apertura cierre"
      />

      <div className="grid grid--two">
        {isAdmin ? (
          <>
            <Card>
              <CardHeader description="El administrador abre boveda antes de que caja reciba efectivo." title="Apertura de boveda" />
              <CardBody>
                <div className="metric-row">
                  <span>Estado</span>
                  <Badge color={cash.isVaultOpen ? 'black' : 'yellow'}>{cash.isVaultOpen ? 'Abierta' : 'Pendiente'}</Badge>
                </div>
                {cash.error ? <p className="message--error">{cash.error}</p> : null}
                <Button disabled={cash.isSaving} onClick={() => void handleToggleVault()}>
                  {cash.isSaving ? 'Procesando...' : cash.isVaultOpen ? 'Cerrar boveda' : 'Abrir boveda'}
                </Button>
                {cash.unclosedCashBoxes.length ? (
                  <div className="table-wrap compact-table">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Caja no cerrada</th>
                          <th>Cajero</th>
                          <th>Apertura</th>
                          <th>Monto inicial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cash.unclosedCashBoxes.map((box) => (
                          <tr key={`${box.cashBox}-${box.openedAt}`}>
                            <td>{box.cashBox}</td>
                            <td>{box.cashier}</td>
                            <td>{new Date(box.openedAt).toLocaleString('es-PE')}</td>
                            <td className="money">{formatMoney(box.openingAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader description="Crea cajas y asigna cajeros activos." title="Cajas" />
              <CardBody>
                <form className="inline-form" onSubmit={handleCreateCashBox}>
                  <div className="field">
                    <label htmlFor="newCashBoxName">Nueva caja</label>
                    <input
                      id="newCashBoxName"
                      onChange={(event) => setNewCashBoxName(event.target.value)}
                      value={newCashBoxName}
                    />
                  </div>
                  <Button disabled={cash.isSaving || !newCashBoxName.trim()} type="submit">
                    Crear caja
                  </Button>
                </form>
                <div className="table-wrap compact-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Caja</th>
                        <th>Cajero activo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cash.boxes?.map((box) => (
                        <tr key={box.id}>
                          <td>{box.name}</td>
                          <td>
                            <select
                              onChange={(event) => handleAssignCashBox(box.id, event.target.value)}
                              value={box.assignedCashierId ?? ''}
                            >
                              <option value="">Sin asignar</option>
                              {cash.cashiers
                                ?.filter(
                                  (cashier) =>
                                    cashier.id === box.assignedCashierId ||
                                    !cash.boxes?.some(
                                      (assignedBox) => assignedBox.id !== box.id && assignedBox.assignedCashierId === cashier.id,
                                    ),
                                )
                                .map((cashier) => (
                                  <option key={cashier.id} value={cashier.id}>
                                    {cashier.fullName}
                                  </option>
                                ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h3>Cajas abiertas</h3>
                <div className="table-wrap compact-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Caja</th>
                        <th>Saldo</th>
                        <th>Adicionar saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cash.sessions?.filter((session) => session.status === 'OPEN').map((session) => (
                        <tr key={session.id}>
                          <td>{session.cashBox}</td>
                          <td className="money">{formatMoney(session.expectedAmount)}</td>
                          <td>
                            <div className="inline-form">
                              <input
                                min="0.01"
                                onChange={(event) => setBalanceAmounts((current) => ({ ...current, [session.id]: event.target.value }))}
                                placeholder="S/ 0.00"
                                step="0.01"
                                type="number"
                                value={balanceAmounts[session.id] ?? ''}
                              />
                              <Button
                                className="button--compact"
                                disabled={cash.isSaving || Number(balanceAmounts[session.id] ?? 0) <= 0}
                                onClick={() => void handleAddBalance(session.id)}
                              >
                                Adicionar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </>
        ) : null}

        {isCashier ? (
          <Card>
            <CardHeader
              description={isClosingMode ? 'Registra efectivo real por denominacion para cerrar caja.' : 'Registra unidades por denominacion para abrir caja.'}
              title={isClosingMode ? 'Cierre de caja' : 'Apertura de caja'}
            />
            <CardBody>
              {!cash.isVaultOpen ? <p className="message--error">Admin debe abrir boveda primero.</p> : null}
              {!assignedCashBoxes.length ? <p className="message--error">No tienes caja asignada.</p> : null}
              {cash.error ? <p className="message--error">{cash.error}</p> : null}
            <div className="form-grid">
              <div className="field">
                <label htmlFor="cashBox">Caja</label>
                <select
                  disabled={!cash.isVaultOpen || !assignedCashBoxes.length}
                  id="cashBox"
                  onChange={(event) => {
                    setSelectedCashBox(event.target.value);
                    setQuantities(initialQuantities);
                  }}
                  value={selectedCashBox}
                >
                  {assignedCashBoxes.map((cashBox) => (
                    <option key={cashBox.id} value={cashBox.name}>
                      {cashBox.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>{isClosingMode ? 'Monto esperado' : 'Maximo permitido'}</label>
                <strong>{formatMoney(isClosingMode && selectedOpenSession ? selectedOpenSession.expectedAmount : maxCashBoxBalance)}</strong>
              </div>
            </div>
            {isClosingMode ? (
              <div className="metric-row">
                <span>Tolerancia</span>
                <strong>{formatMoney(maxCashDifference)}</strong>
              </div>
            ) : null}
            <div className="table-wrap denomination-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Denominacion</th>
                    <th>Cantidad</th>
                    <th className="denomination-table__total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {currencyDenominations.map((denomination) => {
                    const quantity = Number(quantities[denomination.label] ?? 0);
                    const subtotal = Number.isNaN(quantity) ? 0 : denomination.value * quantity;

                    return (
                      <tr key={denomination.label}>
                        <td>{denomination.label}</td>
                        <td>
                          <input
                            disabled={!cash.isVaultOpen}
                            id={`denomination-${denomination.label}`}
                            min="0"
                            onChange={(event) => handleQuantityChange(denomination.label, event.target.value)}
                            step="1"
                            type="number"
                            value={quantities[denomination.label]}
                          />
                        </td>
                        <td className="money denomination-table__total">{formatMoney(subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="metric-row">
              <span>Total contado</span>
              <strong>{formatMoney(denominationTotal)}</strong>
            </div>
            {isClosingMode ? (
              <div className="metric-row">
                <span>Diferencia</span>
                <strong>{formatMoney(closingDifference)}</strong>
              </div>
            ) : null}
            {!isClosingMode && cash.isVaultOpen && exceedsCashLimit ? (
              <p className="message--error">
                El efectivo de apertura no puede superar {formatMoney(maxCashBoxBalance)}.
              </p>
            ) : null}
            {isClosingMode && Math.abs(closingDifference) > maxCashDifference ? (
              <p className="message--error">La diferencia supera la tolerancia configurada.</p>
            ) : null}
            <Button
              disabled={isClosingMode ? !canCloseCashBox : !canOpenCashBox}
              onClick={() => {
                if (isClosingMode) {
                  void handleCloseCashBox();
                  return;
                }

                void handleOpenCashBox();
              }}
            >
              {isClosingMode ? 'Cerrar caja' : 'Abrir caja'}
            </Button>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Caja</th>
              <th>Cajero</th>
              <th>Apertura</th>
              <th>Esperado</th>
              <th>Contado</th>
              <th>Diferencia</th>
              <th>Denominaciones</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cash.sessions?.map((session) => {
              const difference = getCashDifference(session);
              const countedAmount = session.countedAmount === null ? 'Pendiente' : formatMoney(session.countedAmount);
              const differenceAmount = difference === null ? 'Pendiente' : formatMoney(difference);

              return (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{session.cashBox}</td>
                  <td>{session.cashier}</td>
                  <td className="money">{formatMoney(session.openingAmount)}</td>
                  <td className="money">{formatMoney(session.expectedAmount)}</td>
                  <td className="money">{countedAmount}</td>
                  <td className="money">{differenceAmount}</td>
                  <td>{getDenominationSummary(session)}</td>
                  <td>
                    <Badge color={session.status === 'OPEN' ? 'yellow' : 'black'}>
                      {session.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const printCashCloseReport = (report: CashCloseReport, printWindow: Window | null) => {
  if (!printWindow) return;

  writeCloseReportDocument(printWindow, 'Resumen de cierre de caja', `
    <p><strong>Caja:</strong> ${escapePrintHtml(report.cashBox)}</p>
    <p><strong>Cajero:</strong> ${escapePrintHtml(report.cashier)}</p>
    <p><strong>Cierre:</strong> ${new Date(report.closedAt).toLocaleString('es-PE')}</p>
    ${getCashReportSummaryMarkup(report)}
  `);
};

const printVaultCloseReport = (report: VaultCloseReport, printWindow: Window | null) => {
  if (!printWindow) return;

  const rows = report.boxes.map((box) => `
    <tr>
      <td>${escapePrintHtml(box.cashBox)}</td>
      <td>${escapePrintHtml(box.cashier)}</td>
      <td>${formatMoney(box.openingAmount)}</td>
      <td>${formatMoney(box.income)}</td>
      <td>${formatMoney(box.expenses)}</td>
      <td>${formatMoney(box.expectedAmount)}</td>
      <td>${formatMoney(box.countedAmount)}</td>
      <td>${formatMoney(box.difference)}</td>
    </tr>
  `).join('');

  writeCloseReportDocument(printWindow, 'Resumen de cierre de boveda', `
    <p><strong>Boveda:</strong> ${escapePrintHtml(report.vaultName)}</p>
    <p><strong>Cierre:</strong> ${new Date(report.closedAt).toLocaleString('es-PE')}</p>
    <div class="summary">
      <div><span>Apertura total</span><strong>${formatMoney(report.totalOpening)}</strong></div>
      <div><span>Ingresos</span><strong>${formatMoney(report.totalIncome)}</strong></div>
      <div><span>Egresos</span><strong>${formatMoney(report.totalExpenses)}</strong></div>
      <div><span>Esperado</span><strong>${formatMoney(report.totalExpected)}</strong></div>
      <div><span>Contado</span><strong>${formatMoney(report.totalCounted)}</strong></div>
      <div><span>Diferencia</span><strong>${formatMoney(report.totalDifference)}</strong></div>
    </div>
    <table>
      <thead><tr><th>Caja</th><th>Cajero</th><th>Apertura</th><th>Ingresos</th><th>Egresos</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8">Sin cierres de caja registrados hoy</td></tr>'}</tbody>
    </table>
  `);
};

const getCashReportSummaryMarkup = (report: CashCloseReport) => `
  <div class="summary">
    <div><span>Apertura</span><strong>${formatMoney(report.openingAmount)}</strong></div>
    <div><span>Ingresos</span><strong>${formatMoney(report.income)}</strong></div>
    <div><span>Egresos</span><strong>${formatMoney(report.expenses)}</strong></div>
    <div><span>Esperado</span><strong>${formatMoney(report.expectedAmount)}</strong></div>
    <div><span>Contado</span><strong>${formatMoney(report.countedAmount)}</strong></div>
    <div><span>Diferencia</span><strong>${formatMoney(report.difference)}</strong></div>
  </div>
`;

const writeCloseReportDocument = (printWindow: Window, title: string, content: string) => {
  printWindow.document.write(`
    <html>
      <head>
        <title>${escapePrintHtml(title)}</title>
        <style>
          body { color: #111827; font-family: Arial, sans-serif; padding: 24px; }
          ${getPrintBrandStyles()}
          h1 { font-size: 22px; margin: 20px 0 12px; }
          p { margin: 5px 0; }
          .summary { display: grid; gap: 8px; grid-template-columns: repeat(3, 1fr); margin-top: 18px; }
          .summary div { border: 1px solid #d1d5db; padding: 10px; }
          .summary span { display: block; font-size: 11px; margin-bottom: 4px; }
          table { border-collapse: collapse; margin-top: 18px; width: 100%; }
          th, td { border: 1px solid #d1d5db; font-size: 11px; padding: 7px; text-align: right; }
          th:first-child, td:first-child, th:nth-child(2), td:nth-child(2) { text-align: left; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${getPrintBrandMarkup(window.location.origin)}
        <h1>${escapePrintHtml(title)}</h1>
        ${content}
      </body>
    </html>
  `);
  printWindow.document.close();
  printDocument(printWindow);
};
