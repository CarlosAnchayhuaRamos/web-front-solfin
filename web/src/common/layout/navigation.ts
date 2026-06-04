import type { AppRole } from '../auth/AuthProvider';

export const navigationItems = [
  { code: 'IN', label: 'Inicio', path: '/inicio', roles: ['ADMIN', 'ANALYST'] },
  { code: 'SO', label: 'Solicitudes', path: '/solicitudes', roles: ['ADMIN'] },
  { code: 'NC', label: 'Nuevo credito', path: '/nuevo-credito', roles: ['ADMIN', 'ANALYST'] },
  { code: 'CL', label: 'Clientes', path: '/clientes', roles: ['ADMIN', 'ANALYST', 'CASHIER'] },
  { code: 'CO', label: 'Colaboradores', path: '/colaboradores', roles: ['ADMIN'] },
  { code: 'AC', label: 'Apertura cierre', path: '/apertura-cierre', roles: ['ADMIN'] },
  { code: 'PA', label: 'Parametros', path: '/parametros', roles: ['ADMIN'] },
  { code: 'RE', label: 'Reportes', path: '/reportes', roles: ['ADMIN', 'ANALYST'] },
] as const;

export const canAccessPath = (role: AppRole | undefined, path: string) => {
  if (!role) return false;

  const item = navigationItems.find((navigationItem) => navigationItem.path === path);

  if (!item) return false;
  return (item.roles as readonly AppRole[]).includes(role);
};
