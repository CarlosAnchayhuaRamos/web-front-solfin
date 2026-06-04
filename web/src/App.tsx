import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './ui/styles/global.css';
import { ProtectedRoute } from './common/auth/ProtectedRoute';
import { AppShell } from './common/layout/AppShell';
import { LandingView } from './modules/landing/landing-view';
import { InicioView } from './modules/inicio/inicio-view';
import { SolicitudesView } from './modules/solicitudes/solicitudes-view';
import { ReportesView } from './modules/reportes/reportes-view';
import { ColaboradoresView } from './modules/colaboradores/colaboradores-view';
import { ClientesView } from './modules/clientes/clientes-view';
import { ParametrosView } from './modules/parametros/parametros-view';
import { AperturaCierreView } from './modules/apertura-cierre/apertura-cierre-view';
import { NuevoCreditoView } from './modules/nuevo-credito/nuevo-credito-view';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<LandingView />} />
        <Route path="/login" element={<LandingView />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route element={<ProtectedRoute roles={['ADMIN', 'ANALYST']} />}>
              <Route path="/inicio" element={<InicioView />} />
              <Route path="/reportes" element={<ReportesView />} />
              <Route path="/nuevo-credito" element={<NuevoCreditoView />} />
            </Route>
            <Route element={<ProtectedRoute roles={['ADMIN', 'ANALYST', 'CASHIER']} />}>
              <Route path="/clientes" element={<ClientesView />} />
            </Route>
            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/solicitudes" element={<SolicitudesView />} />
              <Route path="/colaboradores" element={<ColaboradoresView />} />
              <Route path="/parametros" element={<ParametrosView />} />
              <Route path="/apertura-cierre" element={<AperturaCierreView />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
