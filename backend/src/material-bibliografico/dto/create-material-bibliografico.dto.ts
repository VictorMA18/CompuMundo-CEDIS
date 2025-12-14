import { IsString, IsInt, IsOptional, IsEnum, ValidateNested, IsArray, MaxLength, IsBoolean, ArrayMinSize, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormatoMaterial } from '@prisma/client';
import { AutorReferenciaDto } from './autor-referencia.dto';

export class CreateMaterialBibliograficoDto {
  @ApiProperty({ example: 'MB-0001', description: 'Código único del material bibliográfico', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  MatBibCod: string;

  @ApiProperty({ example: 'Álgebra Lineal', description: 'Título del material bibliográfico', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  MatBibTit: string;

  @ApiPropertyOptional({ example: false, description: 'Indica si el material es anónimo' })
  @IsBoolean()
  @IsOptional()
  MatBibAno?: boolean;

  @ApiProperty({ example: 1, description: 'ID de la categoría académica' })
  @IsInt()
  CatId: number;

  @ApiPropertyOptional({
    example: 'NINGUNO',
    enum: FormatoMaterial,
    description: 'Formato del material (FISICO, VIRTUAL, MIXTO, NINGUNO). Valor por defecto: NINGUNO'
  })
  @IsEnum(FormatoMaterial)
  @IsOptional()
  MatBibFor?: FormatoMaterial;

  @ApiPropertyOptional({
    example: '2024-06-01T00:00:00.000Z',
    description: 'Fecha de publicación en formato ISO-8601 completo'
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, {
    message: 'MatBibFecPub debe estar en formato ISO-8601 completo, por ejemplo: 2024-06-01T00:00:00.000Z'
  })
  MatBibFecPub?: string;

  @ApiPropertyOptional({
    type: [AutorReferenciaDto],
    description: 'Lista de autores del material bibliográfico'
  })
  @IsOptional()
  @ArrayMinSize(1)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutorReferenciaDto)
  autores?: AutorReferenciaDto[];
}