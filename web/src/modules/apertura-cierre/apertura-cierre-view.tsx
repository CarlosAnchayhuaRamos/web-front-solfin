import React from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { formatMoney } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { cashSessions } from './data';
import { getCashDifference } from './lib';

export const AperturaCierreView: React.FC = () => {
  return (
    <>
      <PageHeader
        actions={<Button>Abrir caja</Button>}
        description="Monitorea la apertura, movimientos y cierre diario de caja y boveda."
        title="Apertura cierre"
      />
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
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cashSessions.map((session) => {
              const difference = getCashDifference(session);

              return (
                <tr key={session.id}>
                  <td>{session.id}</td>
                  <td>{session.cashBox}</td>
                  <td>{session.cashier}</td>
                  <td className="money">{formatMoney(session.openingAmount)}</td>
                  <td className="money">{formatMoney(session.expectedAmount)}</td>
                  <td className="money">{session.countedAmount === null ? 'Pendiente' : formatMoney(session.countedAmount)}</td>
                  <td className="money">{difference === null ? 'Pendiente' : formatMoney(difference)}</td>
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
