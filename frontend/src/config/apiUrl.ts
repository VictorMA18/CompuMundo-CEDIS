// VITE_API_URL:
// - Producción (Vercel): "https://xxxxx.up.railway.app" (SIN /api)
// - Desarrollo (local): vacío para usar el proxy de Vite (/api -> localhost:3000)
const rawOrigin = (import.meta.env.VITE_API_URL ?? '').trim();

// Origen limpio (sin slash final y sin /api por si lo pegaron mal)
export const API_ORIGIN = rawOrigin.replace(/\/+$/, '').replace(/\/api$/i, '');

function normalizePath(path: string): string {
  let p = (path ?? '').trim();
  if (!p) return '/api';

  // Si ya es URL absoluta, no la modificamos
  if (/^https?:\/\//i.test(p)) return p;

  // Asegura slash inicial
  if (!p.startsWith('/')) p = `/${p}`;

  // Evita error típico: "/api/api/..."
  if (p.startsWith('/api/api')) p = p.replace(/^\/api\/api/i, '/api');

  // Fuerza prefijo /api una sola vez
  if (!p.startsWith('/api/')) p = `/api${p}`;

  return p;
}

// Construye la URL final:
// - DEV: "/api/..." (lo resuelve el proxy)
// - PROD: "https://.../api/..."
export function apiUrl(path: string): string {
  const p = normalizePath(path);

  if (/^https?:\/\//i.test(p)) return p;
  if (!API_ORIGIN) return p;

  return `${API_ORIGIN}${p}`;
}