import { IsIn, IsOptional, IsString } from 'class-validator';

export class DevolverPrestamoDto {
  @IsOptional()
  @IsString()
  @IsIn(['disponible', 'dañado', 'perdido'])
  estadoFisico?: string; // Por defecto asumiremos 'disponible' si no envían nada
}