export const API_ORIGIN = import.meta.env.VITE_API_URL;

/**
 * En dev: API_ORIGIN undefined → usamos "/api/..." (proxy de Vite).
 * En prod: API_ORIGIN = "https://tu-backend.com" → construimos "https://tu-backend.com/api/..."
 */
export function apiUrl(path: string): string {
  if (!API_ORIGIN) return path; // dev
  if (/^https?:\/\//i.test(path)) return path; // ya es absoluta
  return `${API_ORIGIN}${path}`; // prod
}