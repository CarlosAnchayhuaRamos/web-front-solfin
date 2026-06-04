import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppRole = 'ADMIN' | 'ANALYST' | 'CASHIER';

interface AuthUser {
  dni: string;
  email: string;
  fullName: string;
  role: AppRole;
}

interface LoginInput {
  identifier: string;
  password: string;
}

interface AuthContextValue {
  error: string | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<boolean>;
  logout: () => void;
  token: string | null;
  user: AuthUser | null;
}

const authStorageKey = 'solfin-authenticated';
const authTokenKey = 'solfin-auth-token';
const authUserKey = 'solfin-auth-user';
const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';
const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = window.localStorage.getItem(authTokenKey);

    setIsAuthenticated(Boolean(storedUser && storedToken));
    setToken(storedToken);
    setUser(storedUser);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        setError('Credenciales invalidas');
        setIsAuthenticated(false);
        setToken(null);
        setUser(null);
        window.localStorage.removeItem(authStorageKey);
        window.localStorage.removeItem(authTokenKey);
        window.localStorage.removeItem(authUserKey);
        return false;
      }

      const data = (await response.json()) as { token: string; user: AuthUser };

      setIsAuthenticated(true);
      setToken(data.token);
      setUser(data.user);
      window.localStorage.setItem(authStorageKey, 'true');
      window.localStorage.setItem(authTokenKey, data.token);
      window.localStorage.setItem(authUserKey, JSON.stringify(data.user));
      return true;
    } catch {
      setError('Credenciales invalidas');
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      window.localStorage.removeItem(authStorageKey);
      window.localStorage.removeItem(authTokenKey);
      window.localStorage.removeItem(authUserKey);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setError(null);
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(authStorageKey);
    window.localStorage.removeItem(authTokenKey);
    window.localStorage.removeItem(authUserKey);
  }, []);

  const value = useMemo(
    () => ({
      error,
      isAuthenticated,
      login,
      logout,
      token,
      user,
    }),
    [error, isAuthenticated, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const hasRole = (user: AuthUser | null, roles: AppRole[]) => {
  if (!user) return false;
  return roles.includes(user.role);
};

const getStoredUser = () => {
  const storedUser = window.localStorage.getItem(authUserKey);

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
};
