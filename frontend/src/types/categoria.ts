export interface Categoria {
  CatId: number;
  CatNom: string;
  CatDes: string | null;
  CatAct: boolean;
  CatFecCre?: string;
  CatFecAct?: string;
}

export interface CategoriaForm {
  CatNom: string;
  CatDes: string;
}

export type CategoriaView = 'activos' | 'desactivadas';
