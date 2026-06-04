import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppRole, hasRole, useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  roles?: AppRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  if (roles && !hasRole(user, roles)) {
    return <Navigate replace to={getFallbackPath(user?.role)} />;
  }

  return <Outlet />;
};

const getFallbackPath = (role: AppRole | undefined) => {
  if (role === 'CASHIER') return '/clientes';
  return '/inicio';
};
