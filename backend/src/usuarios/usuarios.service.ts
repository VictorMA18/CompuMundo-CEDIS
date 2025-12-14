import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { IUsuario } from './interface/usuario.interface';
import { Prisma } from '@prisma/client';

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

  private async withTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<T> {
    if ('$transaction' in prismaClient) {
      return (prismaClient as PrismaService).$transaction(fn);
    }
    return fn(prismaClient as Prisma.TransactionClient);
  }

  async create(data: CreateUsuarioDto, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<IUsuario> {
    return this.withTransaction(async (tx) => {
      const exists = await tx.tB_USUARIO.findUnique({
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

      return tx.tB_USUARIO.create({ data: payload, select: usuarioSelect });
    }, prismaClient);
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

  async findOne(id: number, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<IUsuario> {
    const usuario = await prismaClient.tB_USUARIO.findUnique({
      where: { UsuId: id },
      select: usuarioSelect,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (!usuario.UsuAct) throw new BadRequestException('El usuario está desactivado');
    return usuario;
  }

  async findOneByEmail(email: string, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<IUsuario> {
    const usuario = await prismaClient.tB_USUARIO.findUnique({
      where: { UsuEma: email },
      select: usuarioSelect,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (!usuario.UsuAct) throw new BadRequestException('El usuario está desactivado');
    return usuario;
  }

  async update(id: number, data: UpdateUsuarioDto, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<IUsuario> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);

      if (data.UsuEma) {
        const emailExists = await tx.tB_USUARIO.findFirst({
          where: { UsuEma: data.UsuEma, UsuId: { not: id } },
          select: { UsuId: true },
        });
        if (emailExists) throw new BadRequestException('El email ya está en uso por otro usuario.');
      }

      if (data.UsuCon) {
        data.UsuCon = await bcrypt.hash(data.UsuCon, 10);
      }
      return tx.tB_USUARIO.update({
        where: { UsuId: id },
        data,
        select: usuarioSelect,
      });
    }, prismaClient);
  }

  async reactivar(id: number, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<IUsuario> {
    return this.withTransaction(async (tx) => {
      const usuario = await tx.tB_USUARIO.findUnique({
        where: { UsuId: id },
        select: usuarioSelect,
      });
      if (!usuario) throw new NotFoundException('Usuario no encontrado');
      if (usuario.UsuAct) throw new BadRequestException('El usuario ya está activo');

      return tx.tB_USUARIO.update({
        where: { UsuId: id },
        data: { UsuAct: true },
        select: usuarioSelect,
      });
    }, prismaClient);
  }

  async remove(id: number, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<IUsuario> {
    return this.withTransaction(async (tx) => {
      const usuario = await this.findOne(id, tx);

      if (usuario.UsuEma === 'admin@admin.com') {
        throw new BadRequestException('No se puede desactivar al usuario administrador principal.');
      }

      return tx.tB_USUARIO.update({
        where: { UsuId: id },
        data: { UsuAct: false },
        select: usuarioSelect,
      });
    }, prismaClient);
  }
}
