import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialVirtualDto } from './dto/create-material-virtual.dto';
import { UpdateMaterialVirtualDto } from './dto/update-material-virtual.dto';
import { IMaterialVirtual } from './interface/material-virtual.interface';
import { MaterialBibliograficoService } from '../material-bibliografico/material-bibliografico.service';

@Injectable()
export class MaterialVirtualService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materialBibliograficoService: MaterialBibliograficoService,
  ) {}

  async create(createMaterialVirtualDto: CreateMaterialVirtualDto): Promise<IMaterialVirtual> {
    // Validar existencia del material bibliográfico
    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: createMaterialVirtualDto.MatBibId },
    });
    if (!material) {
      throw new NotFoundException('El material bibliográfico especificado no existe');
    }

    // Validar que no exista ya un material virtual para ese material bibliográfico
    const existente = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
      where: { MatBibId: createMaterialVirtualDto.MatBibId },
    });
    if (existente) {
      throw new BadRequestException('Ya existe un material virtual para este material bibliográfico');
    }

    const created = await this.prisma.tB_MATERIAL_VIRTUAL.create({
      data: createMaterialVirtualDto,
    });

    // Recalcular formato después de crear
    await this.materialBibliograficoService.recalcularFormato(createMaterialVirtualDto.MatBibId);

    return created;
  }

  async findAll(): Promise<IMaterialVirtual[]> {
    return this.prisma.tB_MATERIAL_VIRTUAL.findMany();
  }

  async findOne(id: number): Promise<IMaterialVirtual> {
    const materialVirtual = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
      where: { MatVirId: id },
    });
    if (!materialVirtual) {
      throw new NotFoundException('Material virtual no encontrado');
    }
    return materialVirtual;
  }

  async update(id: number, updateMaterialVirtualDto: UpdateMaterialVirtualDto): Promise<IMaterialVirtual> {
    const materialVirtual = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
      where: { MatVirId: id },
    });
    if (!materialVirtual) {
      throw new NotFoundException('Material virtual no encontrado');
    }

    // Si se actualiza el MatBibId, validar unicidad
    if (
      updateMaterialVirtualDto.MatBibId &&
      updateMaterialVirtualDto.MatBibId !== materialVirtual.MatBibId
    ) {
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
    });

    // Recalcular formato después de actualizar
    await this.materialBibliograficoService.recalcularFormato(updated.MatBibId);

    return updated;
  }

  async remove(id: number): Promise<IMaterialVirtual> {
    const materialVirtual = await this.prisma.tB_MATERIAL_VIRTUAL.findUnique({
      where: { MatVirId: id },
    });
    if (!materialVirtual) {
      throw new NotFoundException('Material virtual no encontrado');
    }
    // Borrado lógico
    const removed = await this.prisma.tB_MATERIAL_VIRTUAL.update({
      where: { MatVirId: id },
      data: { MatVirAct: false },
    });

    // Recalcular formato después de eliminar (borrado lógico)
    await this.materialBibliograficoService.recalcularFormato(materialVirtual.MatBibId);

    return removed;
  }
}