import { IMaterialBibliografico } from "./material-bibliografico.interface";

export interface IMaterialBibliograficoExtendido extends IMaterialBibliografico {
  autoresMaterial?: any[];
  materialesFisicos?: any[];
  materialVirtual?: any;
  totalFisicos: number;
  disponiblesFisicos: number;
  tieneVirtual: boolean;
}