import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AutorReferenciaDto {
  @ApiProperty({ example: 'DOC-12345', description: 'Documento único del autor', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  AutDoc: string;
}