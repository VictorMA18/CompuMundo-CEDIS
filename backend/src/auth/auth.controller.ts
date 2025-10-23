import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: SignInDto) {
    const user = await this.authService.validateUser(signInDto.email, signInDto.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    return this.authService.login(user as any);
  }
}
