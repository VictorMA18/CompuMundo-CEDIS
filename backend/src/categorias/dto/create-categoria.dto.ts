import { IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({ example: 'Matemáticas', description: 'Nombre de la categoría académica', maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  readonly CatNom: string;

  @ApiPropertyOptional({ example: 'Recursos y libros relacionados con matemáticas', description: 'Descripción de la categoría académica' })
  @IsOptional()
  readonly CatDes?: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si la categoría está activa' })
  @IsOptional()
  @IsBoolean()
  readonly CatAct?: boolean;
}