export interface IMaterialFisico {
  MatFisId: number;
  MatBibId: number;
  MatFisCodEje: string;
  MatFisEst: string; // Ej: 'disponible', 'prestado', 'dañado'
  MatFisUbi: string;
  MatFisAct: boolean;
}