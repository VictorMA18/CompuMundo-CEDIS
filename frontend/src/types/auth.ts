export type UsuTip = 'administrador' | 'bibliotecario' | 'consultor';

export interface AuthUser {
  UsuId: number;
  UsuNom?: string;
  UsuEma: string;
  UsuTip: UsuTip;
  UsuAct: boolean;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}
