import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutorDto } from './dto/create-autor.dto';
import { UpdateAutorDto } from './dto/update-autor.dto';
import { IAutor } from './interface/autor.interface';
import { Prisma } from '@prisma/client';

const autorSelect = {
  AutId: true,
  AutDoc: true,
  AutNom: true,
  AutApe: true,
  AutEma: true,
  AutAct: true,
  AutFecCre: true,
  AutFecAct: true,
};

@Injectable()
export class AutorService {
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
    createAutorDto: CreateAutorDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutor> {
    return this.withTransaction(async (tx) => {
      const autor = await tx.tB_AUTOR.findUnique({
        where: { AutDoc: createAutorDto.AutDoc },
        select: autorSelect,
      });

      if (autor) {
        if (autor.AutAct) {
          throw new BadRequestException('El autor ya existe.');
        } else {
          throw new BadRequestException('El autor ya existe pero está desactivado. Debe reactivarse.');
        }
      }

      if (createAutorDto.AutEma) {
        const autorCorreo = await tx.tB_AUTOR.findUnique({
          where: { AutEma: createAutorDto.AutEma },
          select: { AutId: true },
        });
        if (autorCorreo) {
          throw new BadRequestException('El correo electrónico ya está en uso por otro autor.');
        }
      }

      return tx.tB_AUTOR.create({
        data: createAutorDto,
        select: autorSelect,
      });
    }, prismaClient);
  }

  async findAll(): Promise<IAutor[]> {
    return this.prisma.tB_AUTOR.findMany({
      where: { AutAct: true },
      select: autorSelect,
      orderBy: { AutId: 'asc' },
    });
  }

  async findAllDesactivados(): Promise<IAutor[]> {
    return this.prisma.tB_AUTOR.findMany({
      where: { AutAct: false },
      select: autorSelect,
      orderBy: { AutId: 'asc' },
    });
  }

  async findOne(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutor> {
    const autor = await prismaClient.tB_AUTOR.findUnique({
      where: { AutId: id },
      select: autorSelect,
    });
    if (!autor) throw new NotFoundException('Autor no encontrado');
    if (!autor.AutAct) throw new BadRequestException('El autor está desactivado');
    return autor;
  }

  async findOneByDoc(
    AutDoc: string,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutor> {
    const autor = await prismaClient.tB_AUTOR.findUnique({
      where: { AutDoc },
      select: autorSelect,
    });
    if (!autor) throw new NotFoundException('Autor no encontrado');
    if (!autor.AutAct) throw new BadRequestException('El autor está desactivado');
    return autor;
  }

  async update(
    id: number,
    updateAutorDto: UpdateAutorDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutor> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);

      if (updateAutorDto.AutEma) {
        const autorCorreo = await tx.tB_AUTOR.findFirst({
          where: {
            AutEma: updateAutorDto.AutEma,
            AutId: { not: id },
          },
          select: { AutId: true },
        });
        if (autorCorreo) {
          throw new BadRequestException('El correo electrónico ya está en uso por otro autor.');
        }
      }

      return tx.tB_AUTOR.update({
        where: { AutId: id },
        data: updateAutorDto,
        select: autorSelect,
      });
    }, prismaClient);
  }

  async reactivar(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutor> {
    return this.withTransaction(async (tx) => {
      const autor = await tx.tB_AUTOR.findUnique({
        where: { AutId: id },
        select: autorSelect,
      });
      if (!autor) throw new NotFoundException('Autor no encontrado');
      if (autor.AutAct) throw new BadRequestException('El autor ya está activo');

      return tx.tB_AUTOR.update({
        where: { AutId: id },
        data: { AutAct: true },
        select: autorSelect,
      });
    }, prismaClient);
  }

  async remove(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IAutor> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);
      return tx.tB_AUTOR.update({
        where: { AutId: id },
        data: { AutAct: false },
        select: autorSelect,
      });
    }, prismaClient);
  }
}