import { IsInt, IsString, MaxLength, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateMaterialFisicoDto {
  @IsInt()
  MatBibId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  MatFisCodEje: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  MatFisEst: string; // Ej: 'disponible', 'prestado', 'dañado'

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  MatFisUbi: string;

  @IsOptional()
  @IsBoolean()
  MatFisAct?: boolean;
}