import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialVirtualDto } from './dto/create-material-virtual.dto';
import { UpdateMaterialVirtualDto } from './dto/update-material-virtual.dto';
import { IMaterialVirtual } from './interface/material-virtual.interface';
import { MaterialBibliograficoService } from '../material-bibliografico/material-bibliografico.service';

const materialVirtualSelect = {
  MatVirId: true,
  MatBibId: true,
  MatVirUrlAcc: true,
  MatVirForArc: true,
  MatVirAct: true,
};

@Injectable()
export class MaterialVirtualService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materialBibliograficoService: MaterialBibliograficoService,
  ) {}

  async create(createMaterialVirtualDto: CreateMaterialVirtualDto): Promise<IMaterialVirtual> {
    // Validar existencia y activo del material bibliográfico
    await this.materialBibliograficoService.findOne(createMaterialVirtualDto.MatBibId);

    // Validar que no exista ya un material virtual para ese material bibliográfico
    const existente = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
      where: { MatBibId: createMaterialVirtualDto.MatBibId },
    });
    if (existente) {
      if (existente.MatVirAct) {
        throw new BadRequestException('Ya existe un material virtual para este material bibliográfico');
      } else {
        throw new BadRequestException('Ya existe un material virtual para este material bibliográfico pero está desactivado. Debe reactivarse.');
      }
    }

    const created = await this.prisma.tB_MATERIAL_VIRTUAL.create({
      data: createMaterialVirtualDto,
      select: materialVirtualSelect,
    });

    // Recalcular formato después de crear
    await this.materialBibliograficoService.recalcularFormato(createMaterialVirtualDto.MatBibId);

    return created;
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

  async findOne(id: number): Promise<IMaterialVirtual> {
    const materialVirtual = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
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

  async update(id: number, updateMaterialVirtualDto: UpdateMaterialVirtualDto): Promise<IMaterialVirtual> {
    const materialVirtual = await this.findOne(id);

    // Si se actualiza el MatBibId, validar unicidad y que esté activo
    if (
      updateMaterialVirtualDto.MatBibId &&
      updateMaterialVirtualDto.MatBibId !== materialVirtual.MatBibId
    ) {
      await this.materialBibliograficoService.findOne(updateMaterialVirtualDto.MatBibId);
      const existente = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
        where: { MatBibId: updateMaterialVirtualDto.MatBibId },
      });
      if (existente) {
        throw new BadRequestException('Ya existe un material virtual para ese material bibliográfico');
      }
    }

    const updated = await this.prisma.tB_MATERIAL_VIRTUAL.update({
      where: { MatVirId: id },
      data: updateMaterialVirtualDto,
      select: materialVirtualSelect,
    });

    // Recalcular formato después de actualizar
    await this.materialBibliograficoService.recalcularFormato(updated.MatBibId);

    return updated;
  }

  async reactivar(id: number): Promise<IMaterialVirtual> {
    const materialVirtual = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
      where: { MatVirId: id },
    });
    if (!materialVirtual) {
      throw new NotFoundException('Material virtual no encontrado');
    }
    // Validar que el material bibliográfico asociado esté activo
    await this.materialBibliograficoService.findOne(materialVirtual.MatBibId);
    if (materialVirtual.MatVirAct) {
      throw new BadRequestException('El material virtual ya está activo');
    }
    const reactivado = await this.prisma.tB_MATERIAL_VIRTUAL.update({
      where: { MatVirId: id },
      data: { MatVirAct: true },
      select: materialVirtualSelect,
    });
    await this.materialBibliograficoService.recalcularFormato(materialVirtual.MatBibId);
    return reactivado;
  }

  async remove(id: number): Promise<IMaterialVirtual> {
    const materialVirtual = await this.findOne(id);
    // Borrado lógico
    const removed = await this.prisma.tB_MATERIAL_VIRTUAL.update({
      where: { MatVirId: id },
      data: { MatVirAct: false },
      select: materialVirtualSelect,
    });

    // Recalcular formato después de eliminar (borrado lógico)
    await this.materialBibliograficoService.recalcularFormato(materialVirtual.MatBibId);

    return removed;
  }
}