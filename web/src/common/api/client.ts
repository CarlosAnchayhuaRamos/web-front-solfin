export const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';

const authStorageKey = 'solfin-authenticated';
const authTokenKey = 'solfin-auth-token';
const authUserKey = 'solfin-auth-user';

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = window.localStorage.getItem(authTokenKey);
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status !== 401) return response;

  clearAuthSession();
  return response;
};

export const clearAuthSession = () => {
  clearStoredAuthSession();
  window.dispatchEvent(new Event('solfin-auth-expired'));

  if (window.location.pathname === '/login') return;
  window.location.assign('/login');
};

export const clearStoredAuthSession = () => {
  window.localStorage.removeItem(authStorageKey);
  window.localStorage.removeItem(authTokenKey);
  window.localStorage.removeItem(authUserKey);
};
