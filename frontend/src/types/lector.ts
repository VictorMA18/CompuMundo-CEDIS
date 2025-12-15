export type LectorTipo = 'estudiante' | 'docente' | 'administrativo';

export interface Lector {
  LecId: number;
  LecDni: string;
  LecNom: string;
  LecApe: string;
  LecTip: LectorTipo;
  LecEma: string | null;
  LecAct: boolean;
  LecFecCre?: string;
  LecFecAct?: string;
}

export interface LectorForm {
  LecDni: string;
  LecNom: string;
  LecApe: string;
  LecTip: LectorTipo;
  LecEma: string;
}

export type LectorView = 'activos' | 'desactivados';
