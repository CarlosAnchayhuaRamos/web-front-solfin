import React, { useState } from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { formatDueDate, formatMoney } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { approvalStatusMap, approvalStatusOptions, initialApprovalFilters } from './data';
import { useApprovalRequests } from './hooks';
import { filterApprovalRequests, getPendingRequests } from './lib';
import type { ApprovalRequestFilters } from './types';

export const SolicitudesView: React.FC = () => {
  const { error, isLoading, refetch, requests, reviewRequest, reviewingId } = useApprovalRequests();
  const [filters, setFilters] = useState<ApprovalRequestFilters>(initialApprovalFilters);

  const handleFilterChange = (field: keyof ApprovalRequestFilters, value: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          actions={<Button variant="outline">Cargando</Button>}
          description="Aprueba o rechaza creditos pendientes de revision."
          title="Solicitudes"
        />
        <Card>
          <CardBody>Cargando solicitudes...</CardBody>
        </Card>
      </>
    );
  }

  if (error && !requests) {
    return (
      <>
        <PageHeader
          actions={<Button onClick={() => void refetch()}>Reintentar</Button>}
          description="Aprueba o rechaza creditos pendientes de revision."
          title="Solicitudes"
        />
        <Card>
          <CardBody className="message--error">{error}</CardBody>
        </Card>
      </>
    );
  }

  if (!requests?.length) {
    return (
      <>
        <PageHeader
          actions={<Button onClick={() => void refetch()} variant="outline">Actualizar</Button>}
          description="Aprueba o rechaza creditos pendientes de revision."
          title="Solicitudes"
        />
        <Card>
          <CardBody>No hay solicitudes registradas.</CardBody>
        </Card>
      </>
    );
  }

  const filteredRequests = filterApprovalRequests(requests, filters);
  const pendingRequests = getPendingRequests(requests);

  return (
    <>
      <PageHeader
        actions={<Button onClick={() => void refetch()} variant="outline">Actualizar</Button>}
        description="Aprueba o rechaza creditos pendientes de revision."
        title="Solicitudes"
      />
      {error ? (
        <Card>
          <CardBody className="message--error">{error}</CardBody>
        </Card>
      ) : null}
      <Card>
        <CardBody>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="requestDateFrom">Desde</label>
              <input
                id="requestDateFrom"
                onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
                type="date"
                value={filters.dateFrom}
              />
            </div>
            <div className="field">
              <label htmlFor="requestDateTo">Hasta</label>
              <input
                id="requestDateTo"
                onChange={(event) => handleFilterChange('dateTo', event.target.value)}
                type="date"
                value={filters.dateTo}
              />
            </div>
            <div className="field">
              <label htmlFor="requestStatus">Estado</label>
              <select
                id="requestStatus"
                onChange={(event) => handleFilterChange('status', event.target.value)}
                value={filters.status}
              >
                {approvalStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          description={`${pendingRequests.length} pendientes, ${filteredRequests.length} visibles`}
          title="Bandeja de aprobacion"
        />
        <CardBody>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Cliente</th>
                  <th>Analista</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Limite</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const status = approvalStatusMap[request.status];
                  const isPending = request.status === 'PENDING';
                  const isReviewing = reviewingId === request.id;

                  return (
                    <tr key={request.id}>
                      <td>{request.creditCode}</td>
                      <td>{request.clientName}</td>
                      <td>{request.analystName}</td>
                      <td>{request.creditType}</td>
                      <td className="money">{formatMoney(request.amount)}</td>
                      <td className="money">{formatMoney(request.analystLimit)}</td>
                      <td>
                        <Badge color={status.color}>{status.label}</Badge>
                      </td>
                      <td>{formatDueDate(request.requestedAt)}</td>
                      <td>
                        <div className="actions">
                          <Button
                            className="button--compact"
                            disabled={!isPending || isReviewing}
                            onClick={() => void reviewRequest(request.id, 'approve')}
                          >
                            Aprobar
                          </Button>
                          <Button
                            className="button--compact"
                            disabled={!isPending || isReviewing}
                            onClick={() => void reviewRequest(request.id, 'reject')}
                            variant="destructive"
                          >
                            Desaprobar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </>
  );
};
