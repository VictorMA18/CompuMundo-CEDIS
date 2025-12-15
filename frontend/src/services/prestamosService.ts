// src/services/prestamosService.ts
import { CreatePrestamoDto, Prestamo } from '../types/prestamo';

const API_URL = '/api'; 

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
    const res = await fetch(`${API_URL}/prestamos`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al cargar préstamos');
    return res.json();
  },

  // Crear nuevo préstamo
  create: async (data: CreatePrestamoDto): Promise<Prestamo> => {
    const res = await fetch(`${API_URL}/prestamos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al crear préstamo');
    }
    return res.json();
  },

  // Devolver un detalle específico (libro)
  devolverDetalle: async (detalleId: number, estadoFisico: string = 'disponible') => {
    const res = await fetch(`${API_URL}/prestamos/${detalleId}/devolucion`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estadoFisico }),
    });
    if (!res.ok) throw new Error('Error al devolver material');
    return res.json();
  },

  // --- Auxiliares para llenar los Selects del formulario ---
  
  getLectores: async () => {
    const res = await fetch(`${API_URL}/lectores`, { headers: getAuthHeaders() });
    return res.json();
  },

  getMaterialesDisponibles: async () => {
    // Asumiendo que tienes un endpoint para listar materiales físicos
    // Filtraríamos en el frontend los que tengan estado 'disponible' si el backend trae todo
    const res = await fetch(`${API_URL}/material-fisico`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.filter((m: any) => m.MatFisEst === 'disponible');
  }
};