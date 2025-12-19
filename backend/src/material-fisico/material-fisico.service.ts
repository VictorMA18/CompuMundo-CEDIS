import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialFisicoDto } from './dto/create-material-fisico.dto';
import { UpdateMaterialFisicoDto } from './dto/update-material-fisico.dto';
import { IMaterialFisico } from './interface/material-fisico.interface';
import { MaterialBibliograficoService } from '../material-bibliografico/material-bibliografico.service';
import { Prisma } from '@prisma/client';

const materialFisicoSelect = {
  MatFisId: true,
  MatBibId: true,
  MatFisCodEje: true,
  MatFisEst: true,
  MatFisUbi: true,
  MatFisAct: true,
  materialBibliografico: {
    select: {
      MatBibId: true,
      MatBibTit: true, 
      MatBibCod: true
    }
  }
};

@Injectable()
export class MaterialFisicoService {
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
    createMaterialFisicoDto: CreateMaterialFisicoDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialFisico> {
  return this.withTransaction(async (tx) => {
      await this.materialBibliograficoService.findOne(createMaterialFisicoDto.MatBibId, tx);

      const existente = await tx.tB_MATERIAL_FISICO.findUnique({
        where: {
          MatBibId_MatFisCodEje: {
            MatBibId: createMaterialFisicoDto.MatBibId,
            MatFisCodEje: createMaterialFisicoDto.MatFisCodEje,
          },
        },
      });
      if (existente) {
        if (existente.MatFisAct) {
          throw new BadRequestException('El código de ejemplar ya está en uso para este material.');
        } else {
          throw new BadRequestException('El código de ejemplar ya existe pero está desactivado. Debe reactivarse.');
        }
      }

      const created = await tx.tB_MATERIAL_FISICO.create({
        data: createMaterialFisicoDto,
        select: materialFisicoSelect,
      });

      await this.materialBibliograficoService.recalcularFormato(createMaterialFisicoDto.MatBibId, tx);

      return created;
    }, prismaClient);
  }

  async findAll(): Promise<IMaterialFisico[]> {
    return this.prisma.tB_MATERIAL_FISICO.findMany({
      where: { MatFisAct: true },
      orderBy: [
        { MatBibId: 'asc' },
        { MatFisId: 'asc' }
      ],
      select: materialFisicoSelect,
    });
  }

  async findAllDesactivados(): Promise<IMaterialFisico[]> {
    return this.prisma.tB_MATERIAL_FISICO.findMany({
      where: { MatFisAct: false },
      orderBy: [
        { MatBibId: 'asc' },
        { MatFisId: 'asc' }
      ],
      select: materialFisicoSelect,
    });
  }

  async findOne(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialFisico> {

    const materialFisico = await prismaClient.tB_MATERIAL_FISICO.findUnique({
      where: { MatFisId: id },
      select: materialFisicoSelect,
    });
    if (!materialFisico) {
      throw new NotFoundException('Material físico no encontrado');
    }
    if (!materialFisico.MatFisAct) {
      throw new BadRequestException('El material físico está desactivado');
    }
    return materialFisico;
  }

  async findByMaterialBibliografico(matBibId: number): Promise<IMaterialFisico[]> {
    return this.prisma.tB_MATERIAL_FISICO.findMany({
      where: {
        MatBibId: matBibId,
        MatFisAct: true,
      },
      orderBy: [
        { MatFisId: 'asc' }
      ],
      select: materialFisicoSelect,
    });
  }

  async update(
    id: number,
    updateMaterialFisicoDto: UpdateMaterialFisicoDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialFisico> {
    return this.withTransaction(async (tx) => {
      const materialFisico = await this.findOne(id, tx);

      const newMatBibId = updateMaterialFisicoDto.MatBibId ?? materialFisico.MatBibId;
      const newCodEje = updateMaterialFisicoDto.MatFisCodEje ?? materialFisico.MatFisCodEje;

      if (updateMaterialFisicoDto.MatBibId && updateMaterialFisicoDto.MatBibId !== materialFisico.MatBibId) {
        await this.materialBibliograficoService.findOne(updateMaterialFisicoDto.MatBibId, tx);
      }

      // Chequear unicidad usando los valores efectivos (nuevo si cambia)
      if (newCodEje !== materialFisico.MatFisCodEje || newMatBibId !== materialFisico.MatBibId) {
        const existente = await tx.tB_MATERIAL_FISICO.findUnique({
          where: {
            MatBibId_MatFisCodEje: {
              MatBibId: newMatBibId,
              MatFisCodEje: newCodEje,
            },
          },
        });
        if (existente) {
          throw new BadRequestException('Ya existe un ejemplar físico con ese código para este documento bibliográfico');
        }
      }

      const updated = await tx.tB_MATERIAL_FISICO.update({
        where: { MatFisId: id },
        data: updateMaterialFisicoDto,
        select: materialFisicoSelect,
      });

      // Si se movió, recalcular formato para padre antiguo y nuevo; si no, solo para el padre actual
      if (newMatBibId !== materialFisico.MatBibId) {
        await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId, tx);
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
  ): Promise<IMaterialFisico> {
    return this.withTransaction(async (tx) => {
      const materialFisico = await tx.tB_MATERIAL_FISICO.findUnique({
        where: { MatFisId: id },
      });
      if (!materialFisico) {
        throw new NotFoundException('Material físico no encontrado');
      }
      await this.materialBibliograficoService.findOne(materialFisico.MatBibId, tx);
      if (materialFisico.MatFisAct) {
        throw new BadRequestException('El material físico ya está activo');
      }
      const reactivado = await tx.tB_MATERIAL_FISICO.update({
        where: { MatFisId: id },
        data: { MatFisAct: true },
        select: materialFisicoSelect,
      });
      await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId, tx);
      return reactivado;
    }, prismaClient);
  }

  async remove(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialFisico> {
    return this.withTransaction(async (tx) => {
      const materialFisico = await this.findOne(id, tx);
      const removed = await tx.tB_MATERIAL_FISICO.update({
        where: { MatFisId: id },
        data: { MatFisAct: false },
        select: materialFisicoSelect,
      });
      await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId, tx);
      return removed;
    }, prismaClient);
  }
}