import React, { useState } from 'react';
import { Badge } from '../../common/components/Badge';
import { Button } from '../../common/components/Button';
import { useAuth } from '../../common/auth/AuthProvider';
import { formatMoney } from '../../common/lib/format';
import { PageHeader } from '../../common/layout/PageHeader';
import { initialUserForm, userRoleOptions } from './data';
import { useUsers } from './hooks';
import { getUserRoleLabel, toUserFormState } from './lib';
import type { UserFormState, UserItem, UserRole } from './types';

export const ColaboradoresView: React.FC = () => {
  const { token } = useAuth();
  const { error, isLoading, isSaving, refetch, saveUser, users } = useUsers(token);
  const [form, setForm] = useState<UserFormState>(initialUserForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const isEditMode = Boolean(selectedUser);

  const handleChange = (field: keyof UserFormState, value: string | boolean) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleNew = () => {
    setSelectedUser(null);
    setForm(initialUserForm);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (!selectedUser) return;
    setForm(toUserFormState(selectedUser));
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const saved = await saveUser(form, selectedUser?.id);
    if (!saved) return;

    setSelectedUser(null);
    setForm(initialUserForm);
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <>
        <PageHeader description="Crea usuarios, asigna roles y modifica accesos." title="Colaboradores" />
        <div className="card"><div className="card__body">Cargando usuarios...</div></div>
      </>
    );
  }

  if (error && !users) {
    return (
      <>
        <PageHeader actions={<Button onClick={() => void refetch()}>Reintentar</Button>} description="Crea usuarios, asigna roles y modifica accesos." title="Colaboradores" />
        <div className="card"><div className="card__body message--error">{error}</div></div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button onClick={handleNew}>Nuevo usuario</Button>
            <Button disabled={!selectedUser} onClick={handleEdit} variant="secondary">Modificar</Button>
          </>
        }
        description="Crea usuarios, asigna roles y modifica accesos."
        title="Colaboradores"
      />
      {error ? <div className="card"><div className="card__body message--error">{error}</div></div> : null}
      {isFormOpen ? (
        <div className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">{isEditMode ? 'Modificar usuario' : 'Crear usuario'}</h2>
              <p className="card__description">{isEditMode ? 'Contraseña vacia conserva contraseña actual.' : 'Asigna credenciales y rol de acceso.'}</p>
            </div>
          </div>
          <div className="card__body">
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="userFullName">Nombre completo</label>
                <input id="userFullName" onChange={(event) => handleChange('fullName', event.target.value)} required value={form.fullName} />
              </div>
              <div className="field">
                <label htmlFor="userDni">DNI</label>
                <input id="userDni" maxLength={8} onChange={(event) => handleChange('dni', event.target.value)} required value={form.dni} />
              </div>
              <div className="field">
                <label htmlFor="userEmail">Correo</label>
                <input id="userEmail" onChange={(event) => handleChange('email', event.target.value)} required type="email" value={form.email} />
              </div>
              <div className="field">
                <label htmlFor="userPhone">Telefono</label>
                <input id="userPhone" onChange={(event) => handleChange('phone', event.target.value)} value={form.phone} />
              </div>
              <div className="field">
                <label htmlFor="userPosition">Cargo</label>
                <input id="userPosition" onChange={(event) => handleChange('position', event.target.value)} value={form.position} />
              </div>
              <div className="field">
                <label htmlFor="userRole">Rol</label>
                <select id="userRole" onChange={(event) => handleChange('role', event.target.value as UserRole)} value={form.role}>
                  {userRoleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="userCreditLimit">Limite de credito</label>
                <input id="userCreditLimit" min="0" onChange={(event) => handleChange('creditLimit', event.target.value)} step="1" type="number" value={form.creditLimit} />
              </div>
              <div className="field">
                <label htmlFor="userPassword">{isEditMode ? 'Nueva contraseña' : 'Contraseña'}</label>
                <input id="userPassword" minLength={8} onChange={(event) => handleChange('password', event.target.value)} required={!isEditMode} type="password" value={form.password} />
              </div>
              {isEditMode ? (
                <div className="field">
                  <label htmlFor="userActive">Usuario activo</label>
                  <input checked={form.isActive} id="userActive" onChange={(event) => handleChange('isActive', event.target.checked)} type="checkbox" />
                </div>
              ) : null}
              <div className="actions">
                <Button disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear usuario'}</Button>
                <Button onClick={() => setIsFormOpen(false)} type="button" variant="outline">Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {!users?.length ? <div className="card"><div className="card__body">No hay usuarios registrados.</div></div> : null}
      {users?.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>DNI</th><th>Correo</th><th>Rol</th><th>Cargo</th><th>Limite</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className={selectedUser?.id === user.id ? 'table__row--selected' : undefined} key={user.id} onClick={() => setSelectedUser(user)}>
                  <td>{user.fullName}</td>
                  <td>{user.dni}</td>
                  <td>{user.email}</td>
                  <td>{getUserRoleLabel(user.role)}</td>
                  <td>{user.position ?? '-'}</td>
                  <td className="money">{formatMoney(user.creditLimit)}</td>
                  <td><Badge color={user.isActive ? 'blue' : 'yellow'}>{user.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
};
