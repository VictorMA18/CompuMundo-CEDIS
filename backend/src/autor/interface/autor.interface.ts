export interface IAutor {
  AutId: number;
  AutNom: string;
  AutApe: string;
  AutEma?: string | null;
  AutAct: boolean;
  AutFecCre: Date;
  AutFecAct: Date;
}