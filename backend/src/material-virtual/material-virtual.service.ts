import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialVirtualDto } from './dto/create-material-virtual.dto';
import { UpdateMaterialVirtualDto } from './dto/update-material-virtual.dto';
import { IMaterialVirtual } from './interface/material-virtual.interface';
import { MaterialBibliograficoService } from '../material-bibliografico/material-bibliografico.service';
import { Prisma } from '@prisma/client';

const materialVirtualSelect = {
  MatVirId: true,
  MatBibId: true,
  MatVirUrlAcc: true,
  MatVirForArc: true,
  MatVirAct: true,
  materialBibliografico: {
    select: {
      MatBibId: true,
      MatBibTit: true, 
      MatBibCod: true
    }
  }
};

@Injectable()
export class MaterialVirtualService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materialBibliograficoService: MaterialBibliograficoService,
  ) {}

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
    createMaterialVirtualDto: CreateMaterialVirtualDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialVirtual> {
    return this.withTransaction(async (tx) => {
      await this.materialBibliograficoService.findOne(createMaterialVirtualDto.MatBibId, tx);

      const existente = await tx.tB_MATERIAL_VIRTUAL.findUnique({
        where: { MatBibId: createMaterialVirtualDto.MatBibId },
      });
      if (existente) {
        if (existente.MatVirAct) {
          throw new BadRequestException('Ya existe un material virtual para este documento bibliográfico');
        } else {
          throw new BadRequestException('Ya existe un material virtual para este documento bibliográfico pero está desactivado. Debe reactivarse.');
        }
      }

      const created = await tx.tB_MATERIAL_VIRTUAL.create({
        data: createMaterialVirtualDto,
        select: materialVirtualSelect,
      });

      await this.materialBibliograficoService.recalcularFormato(createMaterialVirtualDto.MatBibId, tx);

      return created;
    }, prismaClient);
  }

  async findAll(): Promise<IMaterialVirtual[]> {
    return this.prisma.tB_MATERIAL_VIRTUAL.findMany({
      where: { MatVirAct: true },
      orderBy: [
        { MatBibId: 'asc' },
        { MatVirId: 'asc' }
      ],
      select: materialVirtualSelect,
    });
  }

  async findAllDesactivados(): Promise<IMaterialVirtual[]> {
    return this.prisma.tB_MATERIAL_VIRTUAL.findMany({
      where: { MatVirAct: false },
      orderBy: [
        { MatBibId: 'asc' },
        { MatVirId: 'asc' }
      ],
      select: materialVirtualSelect,
    });
  }

  async findOne(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialVirtual> {

    const materialVirtual = await prismaClient.tB_MATERIAL_VIRTUAL.findUnique({
      where: { MatVirId: id },
      select: materialVirtualSelect,
    });
    if (!materialVirtual) {
      throw new NotFoundException('Material virtual no encontrado');
    }
    if (!materialVirtual.MatVirAct) {
      throw new BadRequestException('El material virtual está desactivado');
    }
    return materialVirtual;
  }

  async findByMaterialBibliografico(matBibId: number): Promise<IMaterialVirtual[]> {
    return this.prisma.tB_MATERIAL_VIRTUAL.findMany({
      where: {
        MatBibId: matBibId,
        MatVirAct: true,
      },
      orderBy: [
        { MatVirId: 'asc' }
      ],
      select: materialVirtualSelect,
    });
  }

  async update(
    id: number,
    updateMaterialVirtualDto: UpdateMaterialVirtualDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialVirtual> {
    return this.withTransaction(async (tx) => {
      const materialVirtual = await this.findOne(id, tx);

      const newMatBibId = updateMaterialVirtualDto.MatBibId ?? materialVirtual.MatBibId;

      if (
        updateMaterialVirtualDto.MatBibId &&
        updateMaterialVirtualDto.MatBibId !== materialVirtual.MatBibId
      ) {
        await this.materialBibliograficoService.findOne(updateMaterialVirtualDto.MatBibId, tx);
        const existente = await tx.tB_MATERIAL_VIRTUAL.findUnique({
          where: { MatBibId: updateMaterialVirtualDto.MatBibId },
        });
        if (existente) {
          throw new BadRequestException('Ya existe un material virtual para ese documento bibliográfico');
        }
      }

      const updated = await tx.tB_MATERIAL_VIRTUAL.update({
        where: { MatVirId: id },
        data: updateMaterialVirtualDto,
        select: materialVirtualSelect,
      });

      // Si se movió, recalcular formato para padre antiguo y nuevo; si no, solo para el padre actual
      if (newMatBibId !== materialVirtual.MatBibId) {
        await this.materialBibliograficoService.recalcularFormato(materialVirtual.MatBibId, tx);
        await this.materialBibliograficoService.recalcularFormato(newMatBibId, tx);
      } else {
        await this.materialBibliograficoService.recalcularFormato(newMatBibId, tx);
      }

      return updated;
    }, prismaClient);
  }

  async reactivar(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialVirtual> {
    return this.withTransaction(async (tx) => {
      const materialVirtual = await tx.tB_MATERIAL_VIRTUAL.findUnique({
        where: { MatVirId: id },
      });
      if (!materialVirtual) {
        throw new NotFoundException('Material virtual no encontrado');
      }
      await this.materialBibliograficoService.findOne(materialVirtual.MatBibId, tx);
      if (materialVirtual.MatVirAct) {
        throw new BadRequestException('El material virtual ya está activo');
      }
      const reactivado = await tx.tB_MATERIAL_VIRTUAL.update({
        where: { MatVirId: id },
        data: { MatVirAct: true },
        select: materialVirtualSelect,
      });
      await this.materialBibliograficoService.recalcularFormato(materialVirtual.MatBibId, tx);
      return reactivado;
    }, prismaClient);
  }

  async remove(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialVirtual> {
    return this.withTransaction(async (tx) => {
      const materialVirtual = await this.findOne(id, tx);
      const removed = await tx.tB_MATERIAL_VIRTUAL.update({
        where: { MatVirId: id },
        data: { MatVirAct: false },
        select: materialVirtualSelect,
      });
      await this.materialBibliograficoService.recalcularFormato(materialVirtual.MatBibId, tx);
      return removed;
    }, prismaClient);
  }
}
