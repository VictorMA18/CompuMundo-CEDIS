// src/services/prestamosService.ts
import { CreatePrestamoDto, Prestamo } from '../types/prestamo';
import { apiUrl } from '../config/apiUrl'; // <-- usar helper centralizado

// Helper para obtener el token (ajusta según donde lo guardes)
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // O usa tu contexto de Auth
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const prestamosService = {
  // Obtener todos los préstamos
  getAll: async (): Promise<Prestamo[]> => {
    const res = await fetch(apiUrl('/prestamos'), { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al cargar préstamos');
    return res.json();
  },

  // Crear nuevo préstamo
  create: async (data: CreatePrestamoDto): Promise<Prestamo> => {
    const res = await fetch(apiUrl('/prestamos'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear préstamo');
    }
    return res.json();
  },

  // Devolver un detalle específico (libro)
  devolverDetalle: async (detalleId: number, estadoFisico: string = 'disponible') => {
    const res = await fetch(apiUrl(`/prestamos/${detalleId}/devolucion`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estadoFisico }),
    });
    if (!res.ok) throw new Error('Error al devolver material');
    return res.json();
  },

  // --- Auxiliares para llenar los Selects del formulario ---
  getLectores: async () => {
    const res = await fetch(apiUrl('/lectores'), { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al cargar lectores');
    return res.json();
  },

  getMaterialesDisponibles: async () => {
    const res = await fetch(apiUrl('/material-fisico'), { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al cargar materiales');
    const data = await res.json();
    return data.filter((m: any) => m.MatFisEst === 'disponible');
  }
};