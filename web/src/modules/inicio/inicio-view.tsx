import React from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { StatCard } from '../../common/components/StatCard';
import { formatMoney } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { workQueue } from './data';
import { useDashboardSummary } from './hooks';
import { getDashboardMetrics, getDashboardScopeLabel, getQueueColor } from './lib';

export const InicioView: React.FC = () => {
  const { error, isLoading, refetch, summary } = useDashboardSummary();

  if (isLoading) {
    return (
      <>
        <PageHeader
          actions={<Button variant="outline">Cargando</Button>}
          description="Resumen operativo de cartera, caja, mora y trabajo pendiente."
          title="Inicio"
        />
        <div className="card">
          <div className="card__body">Cargando indicadores...</div>
        </div>
      </>
    );
  }

  if (error || !summary) {
    return (
      <>
        <PageHeader
          actions={<Button onClick={() => void refetch()} variant="outline">Reintentar</Button>}
          description="Resumen operativo de cartera, caja, mora y trabajo pendiente."
          title="Inicio"
        />
        <div className="card">
          <div className="card__body message--error">{error ?? 'No se encontraron indicadores.'}</div>
        </div>
      </>
    );
  }

  const dashboardMetrics = getDashboardMetrics(summary);

  return (
    <>
      <PageHeader
        actions={<Button onClick={() => void refetch()} variant="outline">Actualizar</Button>}
        description={getDashboardScopeLabel(summary)}
        title="Inicio"
      />
      <section className="grid grid--stats">
        {dashboardMetrics.map((metric) => (
          <StatCard key={metric.id} label={metric.label} trend={metric.trend} value={metric.value} />
        ))}
      </section>
      <section className="grid grid--two">
        <Card>
          <CardHeader description="Indicadores directos de gestion" title="Resumen de cartera" />
          <CardBody>
            <div className="list">
              <article className="list-item">
                <div>
                  <strong>Clientes con credito vigente</strong>
                  <span>Clientes dentro del alcance del perfil.</span>
                </div>
                <Badge color="blue">{summary.activeClientCount}</Badge>
              </article>
              <article className="list-item">
                <div>
                  <strong>Monto vencido</strong>
                  <span>Capital, interes y mora pendiente vencida.</span>
                </div>
                <Badge color="red">{formatMoney(summary.overdueAmount)}</Badge>
              </article>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader description="Prioridades para hoy" title="Trabajo pendiente" />
          <CardBody>
            <div className="list">
              {workQueue.map((item) => (
                <article className="list-item" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                  <Badge color={getQueueColor(item)}>{item.status}</Badge>
                </article>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>
    </>
  );
};
