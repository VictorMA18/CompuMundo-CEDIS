import { IsEnum, IsOptional, IsString, IsNumberString, IsDateString } from 'class-validator';

export enum IntervaloTiempo {
  ANIO = 'ANIO',
  MES = 'MES',
  SEMANA = 'SEMANA',
}

export class FiltrosFechasDto {
  @IsOptional()
  @IsString()
  // @IsDateString() // Puedes usar esto si quieres forzar formato fecha estricto
  inicio?: string;    // formato YYYY-MM-DD

  @IsOptional()
  @IsString()
  fin?: string;       // formato YYYY-MM-DD

  @IsOptional()
  @IsEnum(IntervaloTiempo)
  intervalo?: IntervaloTiempo;
}

export class FiltrosLectoresPorDocumentoDto extends FiltrosFechasDto {
  @IsOptional()
  @IsString()
  MatBibCod?: string; // código del documento

  @IsOptional()
  @IsNumberString() // Usamos IsNumberString porque por Query Param todo llega como texto
  MatBibId?: number;  
}