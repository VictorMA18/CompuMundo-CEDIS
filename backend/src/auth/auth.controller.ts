import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: SignInDto) {
    const user = await this.authService.validateUser(signInDto.UsuEma, signInDto.UsuCon);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const { access_token } = await this.authService.login(user);
    
    return {
      access_token,
      user: {
        UsuId: user.UsuId,
        UsuNom: user.UsuNom,
        UsuEma: user.UsuEma,
        UsuTip: user.UsuTip,
        UsuAct: user.UsuAct,
      },
    };
  }
}