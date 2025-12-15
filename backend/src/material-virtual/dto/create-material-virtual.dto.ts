import { IsInt, IsString, MaxLength, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialVirtualDto {
  @ApiProperty({ example: 1, description: 'ID del material bibliográfico asociado' })
  @IsInt()
  MatBibId: number;

  @ApiProperty({ example: 'https://biblioteca.universidad.edu/materiales/12345.pdf', description: 'URL de acceso al material virtual', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  MatVirUrlAcc: string;

  @ApiProperty({ example: 'PDF', description: 'Formato del archivo virtual', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  MatVirForArc: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si el material virtual está activo' })
  @IsOptional()
  @IsBoolean()
  MatVirAct?: boolean;
}