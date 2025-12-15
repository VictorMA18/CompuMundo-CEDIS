import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.tB_USUARIO.findUnique({ where: { UsuEma: email } });
    if (!user) return null;
    // Validar que el usuario esté activo
    if (!user.UsuAct) {
      throw new UnauthorizedException('Usuario desactivado. Contacte al administrador');
    }
    const matched = await bcrypt.compare(pass, user.UsuCon);
    if (!matched) return null;

    // devuelve datos públicos del usuario (sin contraseña)
    const { UsuCon, ...result } = user;
    return result;
  }

  async login(user: { UsuEma: string, UsuId?: number, UsuTip?: string }) {
    const payload = { sub: user.UsuId, email: user.UsuEma, role: user.UsuTip };
    return {
      access_token: this.jwtService.sign(payload),
      expires_in: process.env.JWT_EXPIRES_IN || '600s'
    };
  }
}
