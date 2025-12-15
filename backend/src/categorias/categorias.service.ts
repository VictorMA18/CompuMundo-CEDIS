import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { ICategoria } from './interface/categoria.interface';
import { Prisma } from '@prisma/client';

const categoriaSelect = {
  CatId: true,
  CatNom: true,
  CatDes: true,
  CatFecCre: true,
  CatFecAct: true,
  CatAct: true,
};

@Injectable()
export class CategoriasService {
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

  async create(
    data: CreateCategoriaDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<ICategoria> {
    return this.withTransaction(async (tx) => {
      const exists = await tx.tB_CATEGORIA.findUnique({
        where: { CatNom: data.CatNom },
        select: categoriaSelect,
      });
      if (exists) {
        if (exists.CatAct) {
          throw new BadRequestException('El nombre de la categoría ya está en uso.');
        } else {
          throw new BadRequestException('El nombre de la categoría ya existe pero está desactivada. Debe reactivarse.');
        }
      }

      const categoria = await tx.tB_CATEGORIA.create({
        data: {
          CatNom: data.CatNom,
          CatDes: data.CatDes,
          CatAct: data.CatAct ?? true,
        },
        select: categoriaSelect,
      });
      return categoria;
    }, prismaClient);
  }

  async findAll(): Promise<ICategoria[]> {
    return this.prisma.tB_CATEGORIA.findMany({
      where: { CatAct: true },
      select: categoriaSelect,
      orderBy: { CatId: 'asc' },
    });
  }

  async findAllDesactivadas(): Promise<ICategoria[]> {
    return this.prisma.tB_CATEGORIA.findMany({
      where: { CatAct: false },
      select: categoriaSelect,
      orderBy: { CatId: 'asc' },
    });
  }

  async findOne(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<ICategoria> {
    const categoria = await prismaClient.tB_CATEGORIA.findUnique({
      where: { CatId: id },
      select: categoriaSelect,
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    if (!categoria.CatAct)
      throw new BadRequestException('La categoría está desactivada');
    return categoria;
  }

  async update(
    id: number,
    data: UpdateCategoriaDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<ICategoria> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);
      if (data.CatNom) {
        const exists = await tx.tB_CATEGORIA.findFirst({
          where: {
            CatNom: data.CatNom,
            CatId: { not: id },
          },
          select: categoriaSelect,
        });
        if (exists) {
          throw new BadRequestException(
            'El nombre de la categoría ya está en uso',
          );
        }
      }

      const updated = await tx.tB_CATEGORIA.update({
        where: { CatId: id },
        data: data,
        select: categoriaSelect,
      });
      return updated;
    }, prismaClient);
  }

  async reactivar(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<ICategoria> {
    return this.withTransaction(async (tx) => {
      const categoria = await tx.tB_CATEGORIA.findUnique({
        where: { CatId: id },
        select: categoriaSelect,
      });
      if (!categoria) throw new NotFoundException('Categoría no encontrada');
      if (categoria.CatAct)
        throw new BadRequestException('La categoría ya está activa');

      return tx.tB_CATEGORIA.update({
        where: { CatId: id },
        data: { CatAct: true },
        select: categoriaSelect,
      });
    }, prismaClient);
  }

  async remove(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<ICategoria> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);

      return tx.tB_CATEGORIA.update({
        where: { CatId: id },
        data: { CatAct: false },
        select: categoriaSelect,
      });
    }, prismaClient);
  }
}