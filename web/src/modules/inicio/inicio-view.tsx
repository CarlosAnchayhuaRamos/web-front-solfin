import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../common/auth/AuthProvider';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { StatCard } from '../../common/components/StatCard';
import { formatMoney } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { dashboardActions } from './data';
import { useDashboardSummary } from './hooks';
import { formatDashboardDate, getCashMetrics, getDashboardMetrics, getDashboardScopeLabel } from './lib';

export const InicioView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error, isLoading, refetch, summary } = useDashboardSummary();

  if (error) {
    return <><PageHeader title="Inicio" description="Resumen operativo" actions={<Button onClick={() => void refetch()} variant="outline">Reintentar</Button>} />
      <p className="message--error" role="alert">{error}</p></>;
  }
  if (isLoading) {
    return <><PageHeader title="Inicio" description="Resumen operativo" /><p role="status">Cargando indicadores...</p></>;
  }
  if (!summary || !user) {
    return <><PageHeader title="Inicio" description="Resumen operativo" /><p>No se encontraron indicadores.</p></>;
  }

  const { portfolio, cash } = summary;
  const isAdmin = summary.scope === 'GENERAL';
  const actions = dashboardActions.filter((action) => action.roles.includes(user.role));

  return (
    <div className="dashboard">
      <PageHeader title="Inicio" description={getDashboardScopeLabel(summary)}
        actions={<Button onClick={() => void refetch()} variant="outline">Actualizar</Button>} />
      <div className="dashboard__toolbar">
        <nav className="dashboard__actions" aria-label="Operaciones">
          {actions.map((action) => <Button key={action.path} variant="outline" onClick={() => navigate(action.path)}>{action.label}</Button>)}
        </nav>
        <time dateTime={summary.generatedAt}>Actualizado {formatDashboardDate(summary.generatedAt)}</time>
      </div>

      {portfolio ? (
        <section className="dashboard__section" aria-labelledby="portfolio-heading">
          <div className="dashboard__heading">
            <h2 id="portfolio-heading">{isAdmin ? 'Cartera de SOLFIN' : 'Mi cartera'}</h2>
            <Badge color="blue">{portfolio.activeClientCount} clientes con credito vigente</Badge>
          </div>
          <div className="grid grid--stats">
            {getDashboardMetrics(portfolio).map((metric) => <StatCard key={metric.id} {...metric} />)}
          </div>
          <div className="dashboard__portfolio-detail">
            <div className="dashboard__risk">
              <h3>Saldo vencido / cartera pendiente</h3>
              <div className="dashboard__risk-total"><strong>{portfolio.overdueRate.toFixed(1)}%</strong><span>{formatMoney(portfolio.overdueAmount)}</span></div>
              <meter min={0} max={100} value={Math.min(100, portfolio.overdueRate)} aria-label="Porcentaje de cartera vencida" />
              <p>{portfolio.overdueCreditCount} creditos en estado vencido</p>
              <p>Saldo promedio por credito: <strong>{formatMoney(portfolio.averageTicket)}</strong></p>
            </div>
            <div className="dashboard__pending">
              <h3>Pendientes</h3>
              <dl>
                <div><dt>{isAdmin ? 'Solicitudes por aprobar' : 'Mis solicitudes en aprobacion'}</dt><dd><Badge color={portfolio.pendingApprovalCount ? 'yellow' : 'gray'}>{portfolio.pendingApprovalCount}</Badge></dd></div>
                <div><dt>Creditos aprobados por desembolsar</dt><dd><Badge color={portfolio.pendingDisbursementCount ? 'blue' : 'gray'}>{portfolio.pendingDisbursementCount}</Badge></dd></div>
                <div><dt>Cuotas pendientes que vencen hoy</dt><dd><Badge color={portfolio.dueTodayCount ? 'yellow' : 'gray'}>{portfolio.dueTodayCount}</Badge></dd></div>
              </dl>
            </div>
          </div>
        </section>
      ) : null}

      {cash ? (
        <section className="dashboard__section" aria-labelledby="cash-heading">
          <div className="dashboard__heading">
            <h2 id="cash-heading">{isAdmin ? 'Boveda y cajas' : 'Mi caja'}</h2>
            <Badge color={cash.sessions.length ? 'blue' : 'gray'}>{cash.sessions.length ? 'Operacion abierta' : 'Sin cajas abiertas'}</Badge>
          </div>
          <div className="dashboard__cash-metrics">
            {isAdmin ? <StatCard label="Saldo de boveda" value={cash.vault ? formatMoney(cash.vault.balance) : 'Sin configurar'} trend={cash.vault?.isOpen ? 'Boveda abierta' : 'Boveda cerrada'} /> : null}
            {getCashMetrics(cash).map((metric) => <StatCard key={metric.id} {...metric} />)}
          </div>
          <div className="dashboard__heading dashboard__heading--secondary">
            <h3>Cajas abiertas</h3>
            <Button variant="outline" onClick={() => navigate('/apertura-cierre')}>Gestionar caja</Button>
          </div>
          {!cash.sessions.length ? <p className="dashboard__empty">{isAdmin ? 'No hay cajas abiertas.' : 'No tienes una caja abierta.'}</p> : (
            <div className="table-wrap">
              <table className="table dashboard__cash-table">
                <thead><tr><th>Caja</th>{isAdmin ? <th>Responsable</th> : null}<th>Apertura</th><th className="table__number">Saldo disponible</th></tr></thead>
                <tbody>{cash.sessions.map((session) => (
                  <tr key={session.id}><td>{session.name}</td>{isAdmin ? <td>{session.cashier}</td> : null}<td>{formatDashboardDate(session.openedAt)}</td><td className="money">{formatMoney(session.balance)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};
