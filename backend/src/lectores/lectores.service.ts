import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLectorDto } from './dto/create-lector.dto';
import { UpdateLectorDto } from './dto/update-lector.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ILector } from './interface/lector.interface';
import { Prisma } from '@prisma/client';

const lectorSelect = {
  LecId: true,
  LecDni: true,
  LecNom: true,
  LecApe: true,
  LecTip: true,
  LecEma: true,
  LecFecCre: true,
  LecFecAct: true,
  LecAct: true,
};

@Injectable()
export class LectoresService {
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

  async create(data: CreateLectorDto, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<ILector> {
    return this.withTransaction(async (tx) => {
      const exists = await tx.tB_LECTOR.findUnique({
        where: { LecDni: data.LecDni },
        select: lectorSelect,
      });
      if (exists) {
        if (exists.LecAct) {
          throw new BadRequestException('El DNI ya está registrado');
        } else {
          throw new BadRequestException('El DNI ya existe pero está desactivado. Debe reactivarse.');
        }
      }

      const payload = {
        LecDni: data.LecDni,
        LecNom: data.LecNom,
        LecApe: data.LecApe,
        LecTip: data.LecTip,
        LecEma: data.LecEma,
        LecAct: true,
      };
      return tx.tB_LECTOR.create({ data: payload, select: lectorSelect });
    }, prismaClient);
  }

  async findAll(): Promise<ILector[]> {
    return this.prisma.tB_LECTOR.findMany({
      where: { LecAct: true },
      select: lectorSelect,
      orderBy: { LecId: 'asc' },
    });
  }

  async findAllDesactivados(): Promise<ILector[]> {
    return this.prisma.tB_LECTOR.findMany({
      where: { LecAct: false },
      select: lectorSelect,
      orderBy: { LecId: 'asc' },
    });
  }

  async findOne(id: number, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<ILector> {
    const lector = await prismaClient.tB_LECTOR.findUnique({
      where: { LecId: id },
      select: lectorSelect,
    });
    if (!lector) throw new NotFoundException('Lector no encontrado');
    if (!lector.LecAct) throw new BadRequestException('El lector está desactivado');
    return lector;
  }

  async update(id: number, data: UpdateLectorDto, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<ILector> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);

      if (data.LecDni) {
        const dniExists = await tx.tB_LECTOR.findUnique({
          where: { LecDni: data.LecDni },
          select: lectorSelect,
        });
        if (dniExists && dniExists.LecId !== id) {
          if (dniExists.LecAct) {
            throw new BadRequestException('El DNI ya está registrado en otro lector');
          } else {
            throw new BadRequestException('El DNI ya existe en otro lector pero está desactivado. Debe reactivarse.');
          }
        }
      }

      return tx.tB_LECTOR.update({
        where: { LecId: id },
        data,
        select: lectorSelect,
      });
    }, prismaClient);
  }

  async reactivar(id: number, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<ILector> {
    return this.withTransaction(async (tx) => {
      const lector = await tx.tB_LECTOR.findUnique({
        where: { LecId: id },
        select: lectorSelect,
      });
      if (!lector) throw new NotFoundException('Lector no encontrado');
      if (lector.LecAct) throw new BadRequestException('El lector ya está activo');

      return tx.tB_LECTOR.update({
        where: { LecId: id },
        data: { LecAct: true },
        select: lectorSelect,
      });
    }, prismaClient);
  }

  async remove(id: number, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma): Promise<ILector> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);
      return tx.tB_LECTOR.update({
        where: { LecId: id },
        data: { LecAct: false },
        select: lectorSelect,
      });
    }, prismaClient);
  }
}
