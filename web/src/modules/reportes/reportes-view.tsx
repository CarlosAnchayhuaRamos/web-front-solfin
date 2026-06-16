import React from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { PageHeader } from '../../common/layout/PageHeader';
import { reports } from './data';
import { usePortfolioReport } from './hooks';
import { getReportActionLabel, printPortfolioReport } from './lib';

export const ReportesView: React.FC = () => {
  const { error, fetchPortfolioReport, isLoading } = usePortfolioReport();

  const handleReportClick = async (reportId: string) => {
    if (reportId !== 'REP-001') return;

    const report = await fetchPortfolioReport();

    if (!report) return;
    printPortfolioReport(report);
  };

  return (
    <>
      <PageHeader
        actions={<Button disabled={isLoading} onClick={() => void handleReportClick('REP-001')}>{isLoading ? 'Generando...' : 'Reporte cartera'}</Button>}
        description="Visualiza y exporta indicadores de cartera, mora, caja, clientes y colaboradores."
        title="Reportes"
      />
      <Card>
        <CardHeader description="Reportes operativos disponibles" title="Biblioteca de reportes" />
        <CardBody>
          {error ? <p className="message--error">{error}</p> : null}
          <div className="list">
            {reports.map((report) => (
              <article className="list-item" key={report.id}>
                <div>
                  <strong>{report.name}</strong>
                  <span>{report.description}</span>
                </div>
                <div className="actions">
                  <Badge color={report.status === 'READY' ? 'blue' : 'yellow'}>{report.format}</Badge>
                  <Button disabled={report.status === 'QUEUED' || isLoading} onClick={() => void handleReportClick(report.id)} variant={report.status === 'READY' ? 'outline' : 'ghost'}>
                    {report.id === 'REP-001' && isLoading ? 'Generando...' : getReportActionLabel(report)}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </CardBody>
      </Card>
    </>
  );
};
