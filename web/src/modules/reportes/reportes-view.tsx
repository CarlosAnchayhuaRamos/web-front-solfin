import React from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { PageHeader } from '../../common/layout/PageHeader';
import { reports } from './data';
import { getReportActionLabel } from './lib';

export const ReportesView: React.FC = () => {
  return (
    <>
      <PageHeader
        actions={<Button>Generar reporte</Button>}
        description="Visualiza y exporta indicadores de cartera, mora, caja, clientes y colaboradores."
        title="Reportes"
      />
      <Card>
        <CardHeader description="Reportes operativos disponibles" title="Biblioteca de reportes" />
        <CardBody>
          <div className="list">
            {reports.map((report) => (
              <article className="list-item" key={report.id}>
                <div>
                  <strong>{report.name}</strong>
                  <span>{report.description}</span>
                </div>
                <div className="actions">
                  <Badge color={report.status === 'READY' ? 'blue' : 'yellow'}>{report.format}</Badge>
                  <Button variant={report.status === 'READY' ? 'outline' : 'ghost'}>{getReportActionLabel(report)}</Button>
                </div>
              </article>
            ))}
          </div>
        </CardBody>
      </Card>
    </>
  );
};
