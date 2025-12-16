import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '../types/auth';
import { apiUrl } from '../config/apiUrl';

type JwtPayload = {
  exp?: number;
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  saveSession: (tokenValue: string, userValue: AuthUser) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = parseJwt(token);
  return typeof payload?.exp === 'number' && payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const saveSession = (tokenValue: string, userValue: AuthUser) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userValue));
    setToken(tokenValue);
    setUser(userValue);
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const logout = () => {
    clearSession();
    window.location.href = '/login';
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(apiUrl(url), { ...options, headers });

    if (response.status === 401) {
      logout();
      window.location.href = '/login';
    }

    return response;
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') setToken(e.newValue);
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? (JSON.parse(e.newValue) as AuthUser) : null);
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!token) return;

    const payload = parseJwt(token);
    if (typeof payload?.exp !== 'number') {
      logout();
      return;
    }

    const expMs = payload.exp * 1000;
    const now = Date.now();

    if (expMs <= now) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(logout, expMs - now);
    return () => window.clearTimeout(timeoutId);
  }, [token]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      saveSession,
      logout,
      authFetch,
      isAuthenticated: !!user && isTokenValid(token),
    };
  }, [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
