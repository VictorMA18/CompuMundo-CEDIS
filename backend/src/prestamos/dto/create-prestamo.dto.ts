import { IsInt, IsArray, ValidateNested, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoPrestamo {
  FISICO = 'FISICO',
  VIRTUAL = 'VIRTUAL',
}

export class CreatePrestamoDetalleDto {
  @IsInt()
  MatBibId: number;

  @IsOptional()
  @IsInt()
  MatFisId?: number; // Obligatorio si es FISICO

  @IsOptional()
  @IsInt()
  MatVirId?: number; // Obligatorio si es VIRTUAL

  @IsEnum(TipoPrestamo)
  PreTip: TipoPrestamo;
}

export class CreatePrestamoDto {
  @IsInt()
  LecId: number; // ID del Lector que pide el libro

  // El UsuId lo tomaremos del Token (request.user), no es necesario enviarlo en el JSON,
  // pero si quieres probar manual puedes dejarlo. Lo ideal es sacarlo del token.
  
  @IsOptional()
  @IsString()
  PreObs?: string; // Observaciones opcionales

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrestamoDetalleDto)
  detalles: CreatePrestamoDetalleDto[];
}