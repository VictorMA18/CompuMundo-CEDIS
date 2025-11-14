import { IsString, IsInt, IsOptional, IsEnum, IsDateString, ValidateNested, IsArray, MaxLength, IsBoolean, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { Matches } from 'class-validator';
import { FormatoMaterial } from '@prisma/client';
import { AutorReferenciaDto } from './autor-referencia.dto';

export class CreateMaterialBibliograficoDto {
  @IsString()
  @MaxLength(50)
  MatBibCod: string;

  @IsString()
  @MaxLength(200)
  MatBibTit: string;

  @IsBoolean()
  @IsOptional()
  MatBibAno?: boolean;

  @IsInt()
  CatId: number;

  @IsEnum(FormatoMaterial)
  MatBibFor: FormatoMaterial;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, {
    message: 'MatBibFecPub debe estar en formato ISO-8601 completo, por ejemplo: 2024-06-01T00:00:00.000Z'
  })
  MatBibFecPub?: string;

  @IsOptional()
  @ArrayMinSize(1)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutorReferenciaDto)
  autores?: AutorReferenciaDto[];
}