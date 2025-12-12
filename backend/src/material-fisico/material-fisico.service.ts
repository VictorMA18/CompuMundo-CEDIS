import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialFisicoDto } from './dto/create-material-fisico.dto';
import { UpdateMaterialFisicoDto } from './dto/update-material-fisico.dto';
import { IMaterialFisico } from './interface/material-fisico.interface';
import { MaterialBibliograficoService } from '../material-bibliografico/material-bibliografico.service';

@Injectable()
export class MaterialFisicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly materialBibliograficoService: MaterialBibliograficoService,
  ) {}

  async create(createMaterialFisicoDto: CreateMaterialFisicoDto): Promise<IMaterialFisico> {
    // Validar existencia del material bibliográfico
    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: createMaterialFisicoDto.MatBibId },
    });
    if (!material) {
      throw new NotFoundException('El material bibliográfico especificado no existe');
    }

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
      throw new BadRequestException('Ya existe un ejemplar físico con ese código para este material');
    }

    const created = await this.prisma.tB_MATERIAL_FISICO.create({
      data: createMaterialFisicoDto,
    });

    // Recalcular formato después de crear
    await this.materialBibliograficoService.recalcularFormato(createMaterialFisicoDto.MatBibId);

    return created;
  }

  async findAll(): Promise<IMaterialFisico[]> {
    return this.prisma.tB_MATERIAL_FISICO.findMany();
  }

  async findOne(id: number): Promise<IMaterialFisico> {
    const materialFisico = await this.prisma.tB_MATERIAL_FISICO.findUnique({
      where: { MatFisId: id },
    });
    if (!materialFisico) {
      throw new NotFoundException('Material físico no encontrado');
    }
    return materialFisico;
  }

  async update(id: number, updateMaterialFisicoDto: UpdateMaterialFisicoDto): Promise<IMaterialFisico> {
    const materialFisico = await this.prisma.tB_MATERIAL_FISICO.findUnique({
      where: { MatFisId: id },
    });
    if (!materialFisico) {
      throw new NotFoundException('Material físico no encontrado');
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
    });

    // Recalcular formato después de actualizar
    await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId);

    return updated;
  }

  async remove(id: number): Promise<IMaterialFisico> {
    const materialFisico = await this.prisma.tB_MATERIAL_FISICO.findUnique({
      where: { MatFisId: id },
    });
    if (!materialFisico) {
      throw new NotFoundException('Material físico no encontrado');
    }
    // Borrado lógico
    const removed = await this.prisma.tB_MATERIAL_FISICO.update({
      where: { MatFisId: id },
      data: { MatFisAct: false },
    });

    // Recalcular formato después de eliminar (borrado lógico)
    await this.materialBibliograficoService.recalcularFormato(materialFisico.MatBibId);

    return removed;
  }
}