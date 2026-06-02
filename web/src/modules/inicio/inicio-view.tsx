import React from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { StatCard } from '../../common/components/StatCard';
import { PageHeader } from '../../common/layout/PageHeader';
import { dashboardMetrics, workQueue } from './data';
import { getQueueColor } from './lib';

export const InicioView: React.FC = () => {
  return (
    <>
      <PageHeader
        actions={<Button>Registrar credito</Button>}
        description="Resumen operativo de cartera, caja, mora y trabajo pendiente."
        title="Inicio"
      />
      <section className="grid grid--stats">
        {dashboardMetrics.map((metric) => (
          <StatCard key={metric.id} label={metric.label} trend={metric.trend} value={metric.value} />
        ))}
      </section>
      <section className="grid grid--two">
        <Card>
          <CardHeader description="Prioridades para hoy" title="Cola de trabajo" />
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
        <Card>
          <CardHeader description="Indicadores de control" title="Riesgo financiero" />
          <CardBody>
            <div className="list">
              <article className="list-item">
                <div>
                  <strong>Clientes observados</strong>
                  <span>Revisar capacidad de pago antes de renovar.</span>
                </div>
                <Badge color="yellow">14</Badge>
              </article>
              <article className="list-item">
                <div>
                  <strong>Creditos vencidos</strong>
                  <span>Gestion de cobranza prioritaria.</span>
                </div>
                <Badge color="red">9</Badge>
              </article>
            </div>
          </CardBody>
        </Card>
      </section>
    </>
  );
};
