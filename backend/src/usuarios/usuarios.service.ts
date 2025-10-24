import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { IUsuario } from './interface/usuario.interface';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUsuarioDto): Promise<IUsuario> {
    const exists = await this.prisma.tB_USUARIO.findUnique({
      where: { UsuEma: data.UsuEma },
    });
    if (exists) throw new BadRequestException('El email ya está registrado');

    const hashed = await bcrypt.hash(data.UsuCon, 10);
    const payload = {
      UsuNom: data.UsuNom,
      UsuEma: data.UsuEma,
      UsuCon: hashed,
      UsuTip: data.UsuTip,
      UsuAct: data.UsuAct ?? true,
    };

    return this.prisma.tB_USUARIO.create({ data: payload });
  }

  async findAll(): Promise<IUsuario[]> {
    return this.prisma.tB_USUARIO.findMany({
      select: {
        UsuId: true,
        UsuNom: true,
        UsuEma: true,
        UsuTip: true,
        UsuFecCre: true,
        UsuFecAct: true,
        UsuAct: true,
      },
    });
  }

  async findOne(id: number): Promise<IUsuario | null> {
    return this.prisma.tB_USUARIO.findUnique({
      where: { UsuId: id },
      select: {
        UsuId: true,
        UsuNom: true,
        UsuEma: true,
        UsuTip: true,
        UsuFecCre: true,
        UsuFecAct: true,
        UsuAct: true,
      },
    });
  }

  async findByEmail(email: string): Promise<IUsuario | null> {
    return this.prisma.tB_USUARIO.findUnique({ where: { UsuEma: email } });
  }

  async update(id: number, data: UpdateUsuarioDto): Promise<IUsuario> {
    if (data.UsuCon) {
      data.UsuCon = await bcrypt.hash(data.UsuCon, 10);
    }
    return this.prisma.tB_USUARIO.update({
      where: { UsuId: id },
      data,
      select: {
        UsuId: true,
        UsuNom: true,
        UsuEma: true,
        UsuTip: true,
        UsuFecCre: true,
        UsuFecAct: true,
        UsuAct: true,
      },
    });
  }

  async remove(id: number): Promise<IUsuario> {
    return this.prisma.tB_USUARIO.delete({ where: { UsuId: id } });
  }
}
