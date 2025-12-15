import { IMaterialBibliografico } from './material-bibliografico.interface';

export interface IAutorRef {
  AutId: number;
  AutNom: string;
  AutApe: string;
  AutDoc: string;
}

export interface IAutorMaterialRef {
  autor: IAutorRef;
}

export interface IMaterialFisicoRef {
  MatFisEst: string;
  MatFisCodEje?: string;
}

export interface IMaterialVirtualRef {
  MatVirId: number;
}

export interface IMaterialBibliograficoExtendido extends IMaterialBibliografico {
  autoresMaterial?: IAutorMaterialRef[];
  materialesFisicos?: IMaterialFisicoRef[];
  materialVirtual?: IMaterialVirtualRef | null;
  totalFisicos: number;
  disponiblesFisicos: number;
  tieneVirtual: boolean;
}