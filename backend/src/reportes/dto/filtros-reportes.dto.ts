export type IntervaloTiempo = 'ANIO' | 'MES' | 'SEMANA';

export class FiltrosFechasDto {
  inicio?: string;    // formato YYYY-MM-DD
  fin?: string;       // formato YYYY-MM-DD
  intervalo?: IntervaloTiempo;
}

export class FiltrosLectoresPorDocumentoDto extends FiltrosFechasDto {
  MatBibCod?: string; // código del documento
  MatBibId?: number;  // id del documento (si usan id numérico)
}