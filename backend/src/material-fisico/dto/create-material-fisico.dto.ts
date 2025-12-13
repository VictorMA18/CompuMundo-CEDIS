import { IsInt, IsString, MaxLength, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialFisicoDto {
  @ApiProperty({ example: 1, description: 'ID del material bibliográfico asociado' })
  @IsInt()
  MatBibId: number;

  @ApiProperty({ example: 'EJ-001', description: 'Código del ejemplar físico', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  MatFisCodEje: string;

  @ApiProperty({
    example: 'disponible',
    description: 'Estado del ejemplar físico',
    enum: ['disponible', 'prestado', 'dañado'],
    maxLength: 20
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsIn(['disponible', 'prestado', 'dañado'])
  MatFisEst: string;

  @ApiProperty({ example: 'Estante A', description: 'Ubicación física del ejemplar', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  MatFisUbi: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si el ejemplar está activo' })
  @IsOptional()
  @IsBoolean()
  MatFisAct?: boolean;
}