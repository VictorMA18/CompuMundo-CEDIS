import { useState } from 'react';
import type { AuthUser } from '../types/auth';
import { loginUser } from '../services/authService';

type LoginResult =
  | { success: true; user: AuthUser; token: string }
  | { success: false };

export function useAuthLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Email y contraseña son requeridos');
      setLoading(false);
      return { success: false };
    }

    const res = await loginUser(email, password);

    if (!res.success) {
      setError(res.error);
      setLoading(false);
      return { success: false };
    }

    const { access_token, user } = res.data;
    setLoading(false);
    return { success: true, user, token: access_token };
  };

  return { handleLogin, loading, error };
}
