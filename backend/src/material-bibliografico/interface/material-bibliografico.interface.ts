import { FormatoMaterial } from '@prisma/client';
import { IAutor } from '../../autor/interface/autor.interface';

export interface IMaterialBibliografico {
  MatBibId: number;
  MatBibCod: string;
  MatBibTit: string;
  MatBibAno: boolean;
  CatId: number;
  MatBibFor: FormatoMaterial;
  MatBibFecPub?: Date | null;
  MatBibFecCre: Date;
  MatBibFecAct: Date;
  MatBibAct: boolean;
  autores?: IAutor[];
}