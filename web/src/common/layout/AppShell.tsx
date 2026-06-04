import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthProvider';
import { AppSidebar } from './AppSidebar';

export const AppShell: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <AppSidebar />
      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="topbar__title">Panel operativo</h1>
            <span className="topbar__meta">Caja, creditos, clientes y aprobaciones</span>
          </div>
          <div className="topbar__user">
            <div>
              <strong>{user?.fullName}</strong>
              <div className="topbar__meta">{getRoleLabel(user?.role)}</div>
            </div>
            <span className="topbar__avatar">SP</span>
            <Button className="button--compact" onClick={handleLogout} variant="outline">
              Salir
            </Button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const getRoleLabel = (role: string | undefined) => {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'ANALYST') return 'Analista';
  if (role === 'CASHIER') return 'Caja';
  return '';
};
