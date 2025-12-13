import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialFisicoDto } from './dto/create-material-fisico.dto';
import { UpdateMaterialFisicoDto } from './dto/update-material-fisico.dto';
import { IMaterialFisico } from './interface/material-fisico.interface';
import { MaterialBibliograficoService } from '../material-bibliografico/material-bibliografico.service';

const materialFisicoSelect = {
  MatFisId: true,
  MatBibId: true,
  MatFisCodEje: true,
  MatFisEst: true,
  MatFisUbi: true,
  MatFisAct: true,
};

@Injectable()
export class MaterialFisicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materialBibliograficoService: MaterialBibliograficoService,
  ) {}

  async create(createMaterialFisicoDto: CreateMaterialFisicoDto): Promise<IMaterialFisico> {
    // Validar existencia del material bibliográfico
    await this.materialBibliograficoService.findOne(createMaterialFisicoDto.MatBibId);

    // Validar unicidad del código de ejemplar para ese material
    const existente = await this.prisma.tB_MATERIAL_FISICO.findUnique({
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

    const created = await this.prisma.tB_MATERIAL_FISICO.create({
      data: createMaterialFisicoDto,
      select: materialFisicoSelect,
    });

    // Recalcular formato después de crear
    await this.materialBibliograficoService.recalcularFormato(createMaterialFisicoDto.MatBibId);

    return created;
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

  async findOne(id: number): Promise<IMaterialFisico> {
    const materialFisico = await this.prisma.tB_MATERIAL_FISICO.findUnique({
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

  async update(id: number, updateMaterialFisicoDto: UpdateMaterialFisicoDto): Promise<IMaterialFisico> {
    const materialFisico = await this.findOne(id);

    if (
      updateMaterialFisicoDto.MatBibId &&
      updateMaterialFisicoDto.MatBibId !== materialFisico.MatBibId
    ) {
      await this.materialBibliograficoService.findOne(updateMaterialFisicoDto.MatBibId);
    }

    // Si se actualiza el código de ejemplar, validar unicidad
    if (
      updateMaterialFisicoDto.MatFisCodEje &&
      updateMaterialFisicoDto.MatFisCodEje !== materialFisico.MatFisCodEje
    ) {
      const existente = await this.prisma.tB_MATERIAL_FISICO.findUnique({
        where: {
          MatBibId_MatFisCodEje: {
            MatBibId: materialFisico.MatBibId,
            MatFisCodEje: updateMaterialFisicoDto.MatFisCodEje,
          },
        },
      });
      if (existente) {
        throw new BadRequestException('Ya existe un ejemplar físico con ese código para este material');
      }
    }

    const updated = await this.prisma.tB_MATERIAL_FISICO.update({
      where: { MatFisId: id },
      data: updateMaterialFisicoDto,
      select: materialFisicoSelect,
    });

    // Recalcular formato después de actualizar
    await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId);

    return updated;
  }

  async reactivar(id: number): Promise<IMaterialFisico> {
    const materialFisico = await this.prisma.tB_MATERIAL_FISICO.findUnique({
      where: { MatFisId: id },
    });
    if (!materialFisico) {
      throw new NotFoundException('Material físico no encontrado');
    }
    await this.materialBibliograficoService.findOne(materialFisico.MatBibId);
    if (materialFisico.MatFisAct) {
      throw new BadRequestException('El material físico ya está activo');
    }
    const reactivado = await this.prisma.tB_MATERIAL_FISICO.update({
      where: { MatFisId: id },
      data: { MatFisAct: true },
      select: materialFisicoSelect,
    });
    await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId);
    return reactivado;
  }

  async remove(id: number): Promise<IMaterialFisico> {
    const materialFisico = await this.findOne(id);
    // Borrado lógico
    const removed = await this.prisma.tB_MATERIAL_FISICO.update({
      where: { MatFisId: id },
      data: { MatFisAct: false },
      select: materialFisicoSelect,
    });

    // Recalcular formato después de eliminar (borrado lógico)
    await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId);

    return removed;
  }
}