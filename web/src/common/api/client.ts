export const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';

const authTokenKey = 'solfin-auth-token';

export const apiFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const token = window.localStorage.getItem(authTokenKey);
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
};
