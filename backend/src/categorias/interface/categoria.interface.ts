export interface ICategoria {
  CatId: number;
  CatNom: string;
  CatDes: string | null;
  CatFecCre: Date;
  CatFecAct: Date;
  CatAct: boolean;
}