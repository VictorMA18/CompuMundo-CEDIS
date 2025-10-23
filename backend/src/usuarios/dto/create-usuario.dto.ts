import { IsEmail, IsIn, IsNotEmpty, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty()
  @MaxLength(100)
  readonly UsuNom: string;

  @IsEmail()
  readonly UsuEma: string;

  @MinLength(6)
  readonly UsuCon: string;

  @IsIn(['administrador', 'bibliotecario', 'consultor'])
  readonly UsuTip: string;

  @IsOptional()
  @IsBoolean()
  readonly UsuAct?: boolean;
}
