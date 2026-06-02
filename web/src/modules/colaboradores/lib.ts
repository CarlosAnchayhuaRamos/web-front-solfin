import type { Employee } from './types';

export const getEmployeeStatusLabel = (employee: Employee) => {
  if (employee.status === 'SUSPENDED') return 'Suspendido';
  if (employee.status === 'INACTIVE') return 'Inactivo';
  return 'Activo';
};
