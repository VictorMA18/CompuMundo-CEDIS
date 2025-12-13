import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @ApiPropertyOptional({ example: 'nuevaPassword123', description: 'Nueva contraseña del usuario', minLength: 6 })
  @IsOptional()
  @MinLength(6)
  UsuCon?: string;
}
