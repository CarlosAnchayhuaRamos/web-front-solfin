import React, { useState } from 'react';
import { useDocumentDownload } from '../../common/api/hooks/use-document-download';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { formatDueDate, formatMoney } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { approvalStatusMap, approvalStatusOptions, initialApprovalFilters } from './data';
import { useApprovalRequests } from './hooks';
import { filterApprovalRequests, getPendingRequests, normalizeDateInput } from './lib';
import type { ApprovalRequestFilters } from './types';

export const SolicitudesView: React.FC = () => {
  const { downloadDocument, downloadError, downloadingId } = useDocumentDownload();
  const { error, isLoading, refetch, requests, reviewRequest, reviewingId } = useApprovalRequests();
  const [filters, setFilters] = useState<ApprovalRequestFilters>(initialApprovalFilters);

  const handleFilterChange = (field: keyof ApprovalRequestFilters, value: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const handleApprove = async (requestId: string) => {
    await reviewRequest(requestId, 'approve');
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
          {downloadError ? <p className="message--error">{downloadError}</p> : null}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="requestDateFrom">Desde</label>
              <input
                id="requestDateFrom"
                inputMode="numeric"
                maxLength={10}
                onChange={(event) => handleFilterChange('dateFrom', normalizeDateInput(event.target.value))}
                pattern="\d{4}-\d{2}-\d{2}"
                placeholder="YYYY-MM-DD"
                type="text"
                value={filters.dateFrom}
              />
            </div>
            <div className="field">
              <label htmlFor="requestDateTo">Hasta</label>
              <input
                id="requestDateTo"
                inputMode="numeric"
                maxLength={10}
                onChange={(event) => handleFilterChange('dateTo', normalizeDateInput(event.target.value))}
                pattern="\d{4}-\d{2}-\d{2}"
                placeholder="YYYY-MM-DD"
                type="text"
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
                  <th>Archivos</th>
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
                        {request.files.length ? (
                          <div className="list">
                            {request.files.map((file) =>
                              file.sizeBytes > 0 ? (
                                <Button disabled={downloadingId === file.id} onClick={() => void downloadDocument(file.id, file.fileName)} variant="outline" key={file.id}>
                                  {file.fileName}
                                </Button>
                              ) : (
                                <span key={file.id}>{file.fileName}</span>
                              ),
                            )}
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>
                        <div className="actions">
                          <Button
                            className="button--compact"
                            disabled={!isPending || isReviewing}
                            onClick={() => void handleApprove(request.id)}
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
