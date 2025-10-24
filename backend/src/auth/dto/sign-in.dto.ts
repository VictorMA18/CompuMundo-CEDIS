import { IsEmail, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  readonly UsuEma: string;
  @MinLength(6)
  readonly UsuCon: string;
}
