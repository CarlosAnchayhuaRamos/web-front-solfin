import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { useAuth } from '../../common/auth/AuthProvider';
import { formatMoney } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { useCashPolicy } from '../parametros/hooks';
import { currencyDenominations } from './data';
import { useCashSessions } from './hooks';
import { getCashDifference, getDenominationCounts, getDenominationSummary, getDenominationTotal } from './lib';

const initialQuantities = Object.fromEntries(currencyDenominations.map((denomination) => [denomination.label, '0']));

export const AperturaCierreView: React.FC = () => {
  const { user } = useAuth();
  const { cashPolicy } = useCashPolicy();
  const cash = useCashSessions();
  const [newCashBoxName, setNewCashBoxName] = useState('');
  const [selectedCashBox, setSelectedCashBox] = useState('');
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

  const handleToggleVault = () => {
    if (cash.isVaultOpen) {
      void cash.closeVault();
      return;
    }

    void cash.openVault();
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

    const closed = await cash.closeCashSession(
      selectedOpenSession.id,
      denominationTotal,
      getDenominationCounts(currencyDenominations, quantities),
    );

    if (!closed) return;
    setQuantities(initialQuantities);
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
                <Button disabled={cash.isSaving} onClick={handleToggleVault}>
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
                              {cash.cashiers?.map((cashier) => (
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
