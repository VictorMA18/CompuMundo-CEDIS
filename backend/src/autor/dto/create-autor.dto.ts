import { IsString, IsOptional, IsBoolean, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAutorDto {
  @ApiProperty({ example: 'María', description: 'Nombre del autor', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  readonly AutNom: string;

  @ApiProperty({ example: 'García', description: 'Apellido del autor', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  readonly AutApe: string;

  @ApiProperty({ example: 'DOC-987654', description: 'Documento único del autor', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  readonly AutDoc: string;

  @ApiPropertyOptional({ example: 'maria.garcia@unsa.edu.pe', description: 'Correo electrónico del autor', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(100)
  readonly AutEma?: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si el autor está activo' })
  @IsOptional()
  @IsBoolean()
  readonly AutAct?: boolean;
}