import type { LoginResponse } from '../types/auth';
import { apiUrl } from '../config/apiUrl';

type LoginSuccess = { success: true; data: LoginResponse };
type LoginFailure = { success: false; error: string };

type ApiError = { message?: string | string[] };

function getApiErrorMessage(data: unknown): string | null {
  const err = data as ApiError;
  if (Array.isArray(err?.message)) return err.message.join(', ');
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return null;
}

function isLoginResponse(data: unknown): data is LoginResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.access_token !== 'string') return false;
  if (!d.user || typeof d.user !== 'object') return false;
  return true;
}

export async function loginUser(email: string, password: string): Promise<LoginSuccess | LoginFailure> {
  try {
    const res = await fetch(apiUrl(`/api/auth/login`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UsuEma: email, UsuCon: password }),
    });

    const data: unknown = await res.json().catch(() => ({} as unknown));

    if (!res.ok) {
      return { success: false, error: getApiErrorMessage(data) || 'Credenciales inválidas' };
    }

    if (!isLoginResponse(data)) {
      return { success: false, error: 'Respuesta inválida del servidor' };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}
