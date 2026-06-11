import { useCallback, useEffect, useState } from 'react';
import type { UserFormState, UserItem } from './types';

const apiBaseUrl = process.env.REACT_APP_API_URL ?? 'http://127.0.0.1:4000';

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(', ');
    return data.message ?? 'Error del backend';
  } catch {
    return 'Error del backend';
  }
};

export const useUsers = (token: string | null) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<UserItem[] | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return false;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        setError(await getErrorMessage(response));
        return false;
      }

      setUsers((await response.json()) as UserItem[]);
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const saveUser = useCallback(async (form: UserFormState, userId?: string) => {
    if (!token) return false;

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/users${userId ? `/${userId}` : ''}`, {
        body: JSON.stringify({
          ...form,
          creditLimit: Number(form.creditLimit),
          password: form.password || undefined,
        }),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        method: userId ? 'PUT' : 'POST',
      });

      if (!response.ok) {
        setError(await getErrorMessage(response));
        return false;
      }

      const savedUser = (await response.json()) as UserItem;
      setUsers((currentUsers) => {
        if (!currentUsers) return [savedUser];
        if (!userId) return [...currentUsers, savedUser].sort((a, b) => a.fullName.localeCompare(b.fullName));
        return currentUsers.map((user) => (user.id === savedUser.id ? savedUser : user));
      });
      return true;
    } catch {
      setError('No se pudo conectar con el backend');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return { error, isLoading, isSaving, refetch: fetchUsers, saveUser, users };
};
