import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { appUser } from './data';

export const AppShell: React.FC = () => {
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
              <strong>{appUser.fullName}</strong>
              <div className="topbar__meta">{appUser.role}</div>
            </div>
            <span className="topbar__avatar">SP</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
