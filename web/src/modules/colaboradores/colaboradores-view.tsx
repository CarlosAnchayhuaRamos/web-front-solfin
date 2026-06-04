import React from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { PageHeader } from '../../common/layout/PageHeader';
import { employees } from './data';
import { getEmployeeStatusLabel } from './lib';

export const ColaboradoresView: React.FC = () => {
  return (
    <>
      <PageHeader
        actions={<Button>Nuevo colaborador</Button>}
        description="Administra empleados, roles internos y datos de contacto."
        title="Colaboradores"
      />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{employee.fullName}</td>
                <td>{employee.dni}</td>
                <td>{employee.email}</td>
                <td>{employee.role}</td>
                <td>
                  <Badge color={employee.status === 'SUSPENDED' ? 'yellow' : 'blue'}>{getEmployeeStatusLabel(employee)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
