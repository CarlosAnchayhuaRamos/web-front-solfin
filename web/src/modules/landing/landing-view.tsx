import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../common/components/Button';
import { useAuth } from '../../common/auth/AuthProvider';

export const LandingView: React.FC = () => {
  const { error, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const loggedIn = await login({ identifier, password });

    if (!loggedIn) return;

    navigate('/inicio');
  };

  if (isAuthenticated) {
    return <Navigate replace to="/inicio" />;
  }

  return (
    <main className="landing">
      <section className="landing__content">
        <div className="landing__brand">
          <span className="landing__eyebrow">SOLFIN PERU</span>
          <h1>Gestion financiera para creditos, clientes y cobranza</h1>
        </div>
        <form className="landing__login" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="identifier">Correo o DNI</label>
            <input
              autoComplete="username"
              id="identifier"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Correo o DNI"
              required
              value={identifier}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              autoComplete="current-password"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña"
              required
              type="password"
              value={password}
            />
          </div>
          {error ? <p className="message--error">{error}</p> : null}
          <Button type="submit">Ingresar</Button>
        </form>
      </section>
    </main>
  );
};
