import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutorMaterialDto } from './dto/create-autor-material.dto';
import { IAutorMaterial } from './interface/autor-material.interface';
import { Prisma } from '@prisma/client';

const autorMaterialSelect = {
  AutMatId: true,
  MatBibId: true,
  AutId: true,
  AutMatFecCre: true,
  AutMatFecAct: true,
  AutMatAct: true,
};

@Injectable()
export class AutorMaterialService {
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
    createAutorMaterialDto: CreateAutorMaterialDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutorMaterial> {
    return this.withTransaction(async (tx) => {
      const material = await tx.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
        where: { MatBibId: createAutorMaterialDto.MatBibId },
        select: { MatBibAct: true },
      });
      if (!material) {
        throw new BadRequestException('El material bibliográfico no existe.');
      }
      if (!material.MatBibAct) {
        throw new BadRequestException('El material bibliográfico está desactivado.');
      }

      const autor = await tx.tB_AUTOR.findUnique({
        where: { AutId: createAutorMaterialDto.AutId },
        select: { AutAct: true },
      });
      if (!autor) {
        throw new BadRequestException('El autor no existe.');
      }
      if (!autor.AutAct) {
        throw new BadRequestException('El autor está desactivado.');
      }

      const existente = await tx.tB_AUTOR_MATERIAL.findUnique({
        where: {
          MatBibId_AutId: {
            MatBibId: createAutorMaterialDto.MatBibId,
            AutId: createAutorMaterialDto.AutId,
          },
        },
        select: autorMaterialSelect,
      });

      if (existente) {
        if (existente.AutMatAct) {
          throw new BadRequestException('La relación autor-material ya existe y está activa.');
        } else {
          throw new BadRequestException('La relación autor-material existe pero está desactivada. Debe reactivarse.');
        }
      }

      return tx.tB_AUTOR_MATERIAL.create({
        data: {
          MatBibId: createAutorMaterialDto.MatBibId,
          AutId: createAutorMaterialDto.AutId,
        },
        select: autorMaterialSelect,
      });
    }, prismaClient);
  }

  async reactivar(
    matBibId: number,
    autId: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutorMaterial> {
    return this.withTransaction(async (tx) => {
      const existente = await tx.tB_AUTOR_MATERIAL.findUnique({
        where: {
          MatBibId_AutId: {
            MatBibId: matBibId,
            AutId: autId,
          },
        },
        select: autorMaterialSelect,
      });

      if (!existente) {
        throw new NotFoundException('La relación autor-material no existe.');
      }
      if (existente.AutMatAct) {
        throw new BadRequestException('La relación autor-material ya está activa.');
      }

      return tx.tB_AUTOR_MATERIAL.update({
        where: {
          MatBibId_AutId: {
            MatBibId: matBibId,
            AutId: autId,
          },
        },
        data: { AutMatAct: true },
        select: autorMaterialSelect,
      });
    }, prismaClient);
  }

  async remove(
    matBibId: number,
    autId: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutorMaterial> {
    return this.withTransaction(async (tx) => {
      const existente = await tx.tB_AUTOR_MATERIAL.findUnique({
        where: {
          MatBibId_AutId: {
            MatBibId: matBibId,
            AutId: autId,
          },
        },
        select: autorMaterialSelect,
      });
      if (!existente) {
        throw new NotFoundException('La relación autor-material no existe.');
      }
      if (!existente.AutMatAct) {
        throw new BadRequestException('La relación autor-material ya está desactivada.');
      }

      return tx.tB_AUTOR_MATERIAL.update({
        where: {
          MatBibId_AutId: {
            MatBibId: matBibId,
            AutId: autId,
          },
        },
        data: { AutMatAct: false },
        select: autorMaterialSelect,
      });
    }, prismaClient);
  }
}