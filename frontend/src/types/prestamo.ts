// src/types/prestamo.ts

import { Lector } from './lector'; // Asumiendo que ya tienes este tipo, si no, defínelo abajo
// import { MaterialFisico } from './material'; // Igual para material

// Si no tienes los tipos de Lector y Material definidos, usa estos básicos:
export interface LectorSimple {
  LecId: number;
  LecNom: string;
  LecApe: string;
  LecDni: string;
}

export interface MaterialFisicoSimple {
  MatFisId: number;
  MatFisCodEje: string;
  MatFisEst: string;
  materialBibliografico: {
    MatBibTit: string;
    MatBibId: number;
  };
}

export interface PrestamoDetalle {
  PreDetId: number;
  MatBibId: number;
  MatFisId: number;
  PreTip: 'FISICO' | 'VIRTUAL';
  PreEst: string;
  materialFisico?: {
    MatFisCodEje: string;
  };
  materialBibliografico?: {
    MatBibTit: string;
  };
}

export interface Prestamo {
  PreId: number;
  LecId: number;
  PreFecPre: string; // Fecha Préstamo
  PreFecVen: string; // Fecha Vencimiento
  PreEst: string;    // 'VIGENTE', 'VENCIDO', 'DEVUELTO'
  PreObs?: string;
  lector: LectorSimple;
  detalles: PrestamoDetalle[];
}

// DTO para crear un préstamo nuevo
export interface CreatePrestamoDto {
  LecId: number;
  PreObs?: string;
  detalles: {
    MatBibId: number;
    MatFisId: number;
    PreTip: 'FISICO' | 'VIRTUAL';
  }[];
}