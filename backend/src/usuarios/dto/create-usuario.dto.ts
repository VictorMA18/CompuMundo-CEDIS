import { IsEmail, IsIn, IsNotEmpty, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del usuario', maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  readonly UsuNom: string;

  @ApiProperty({ example: 'juan@email.com', description: 'Correo electrónico del usuario' })
  @IsEmail()
  readonly UsuEma: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario', minLength: 6 })
  @MinLength(6)
  readonly UsuCon: string;

  @ApiProperty({ example: 'administrador', description: 'Tipo de usuario', enum: ['administrador', 'bibliotecario', 'consultor'] })
  @IsIn(['administrador', 'bibliotecario', 'consultor'])
  readonly UsuTip: string;

  @ApiProperty({ example: true, description: 'Indica si el usuario está activo', required: false })
  @IsOptional()
  @IsBoolean()
  readonly UsuAct?: boolean;
}