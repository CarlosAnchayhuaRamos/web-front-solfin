import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './ui/styles/global.css';
import { AppShell } from './common/layout/AppShell';
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
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<InicioView />} />
          <Route path="/solicitudes" element={<SolicitudesView />} />
          <Route path="/reportes" element={<ReportesView />} />
          <Route path="/colaboradores" element={<ColaboradoresView />} />
          <Route path="/clientes" element={<ClientesView />} />
          <Route path="/parametros" element={<ParametrosView />} />
          <Route path="/apertura-cierre" element={<AperturaCierreView />} />
          <Route path="/nuevo-credito" element={<NuevoCreditoView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
