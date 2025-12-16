import type { UsuTip } from './auth';

export interface Usuario {
  UsuId: number;
  UsuNom: string;
  UsuEma: string;
  UsuTip: UsuTip;
  UsuAct: boolean;
  UsuFecCre?: string;
  UsuFecAct?: string;
}

export interface UsuarioForm {
  UsuNom: string;
  UsuEma: string;
  UsuTip: UsuTip;
  UsuCon: string;
}

export type UsuarioView = 'activos' | 'desactivados';
