import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { IUsuario } from './interface/usuario.interface';

const usuarioSelect = {
  UsuId: true,
  UsuNom: true,
  UsuEma: true,
  UsuTip: true,
  UsuFecCre: true,
  UsuFecAct: true,
  UsuAct: true,
};

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUsuarioDto): Promise<IUsuario> {
    const exists = await this.prisma.tB_USUARIO.findUnique({
      where: { UsuEma: data.UsuEma },
      select: usuarioSelect,
    });
    if (exists) {
      if (exists.UsuAct) {
        throw new BadRequestException('El email ya está registrado');
      } else {
        throw new BadRequestException('El email ya existe pero está desactivado. Debe reactivarse.');
      }
    }

    const hashed = await bcrypt.hash(data.UsuCon, 10);
    const payload = {
      UsuNom: data.UsuNom,
      UsuEma: data.UsuEma,
      UsuCon: hashed,
      UsuTip: data.UsuTip,
      UsuAct: true,
    };

    return this.prisma.tB_USUARIO.create({ data: payload, select: usuarioSelect });
  }

  async findAll(): Promise<IUsuario[]> {
    return this.prisma.tB_USUARIO.findMany({
      where: { UsuAct: true },
      select: usuarioSelect,
      orderBy: { UsuId: 'asc' },
    });
  }

  async findAllDesactivados(): Promise<IUsuario[]> {
    return this.prisma.tB_USUARIO.findMany({
      where: { UsuAct: false },
      select: usuarioSelect,
      orderBy: { UsuId: 'asc' },
    });
  }

  async findOne(id: number): Promise<IUsuario> {
    const usuario = await this.prisma.tB_USUARIO.findUnique({
      where: { UsuId: id },
      select: usuarioSelect,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (!usuario.UsuAct) throw new BadRequestException('El usuario está desactivado');
    return usuario;
  }

  async findByEmail(email: string): Promise<IUsuario | null> {
    return this.prisma.tB_USUARIO.findUnique({ where: { UsuEma: email } });
  }

  async findOneByEmail(email: string): Promise<IUsuario> {
      const usuario = await this.prisma.tB_USUARIO.findUnique({
        where: { UsuEma: email },
        select: usuarioSelect,
      });
      if (!usuario) throw new NotFoundException('Usuario no encontrado');
      if (!usuario.UsuAct) throw new BadRequestException('El usuario está desactivado');
      return usuario;
    }

  async update(id: number, data: UpdateUsuarioDto): Promise<IUsuario> {
    await this.findOne(id);

    if (data.UsuCon) {
      data.UsuCon = await bcrypt.hash(data.UsuCon, 10);
    }
    return this.prisma.tB_USUARIO.update({
      where: { UsuId: id },
      data,
      select: usuarioSelect,
    });
  }

  async reactivar(id: number): Promise<IUsuario> {
    const usuario = await this.prisma.tB_USUARIO.findUnique({
      where: { UsuId: id },
      select: usuarioSelect,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (usuario.UsuAct) throw new BadRequestException('El usuario ya está activo');

    return this.prisma.tB_USUARIO.update({
      where: { UsuId: id },
      data: { UsuAct: true },
      select: usuarioSelect,
    });
  }

  async remove(id: number): Promise<IUsuario> {
    const usuario = await this.findOne(id);

    // No permitir desactivar al usuario administrador principal
    if (usuario.UsuEma === 'admin@admin.com') {
      throw new BadRequestException('No se puede desactivar al usuario administrador principal.');
    }

    return this.prisma.tB_USUARIO.update({
      where: { UsuId: id },
      data: { UsuAct: false },
      select: usuarioSelect,
    });
  }
}
