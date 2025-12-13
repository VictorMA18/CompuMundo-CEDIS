import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutorMaterialDto } from './dto/create-autor-material.dto';
import { IAutorMaterial } from './interface/autor-material.interface';

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

  async create(createAutorMaterialDto: CreateAutorMaterialDto): Promise<IAutorMaterial> {
    // Validar que el material bibliográfico esté activo
    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: createAutorMaterialDto.MatBibId },
      select: { MatBibAct: true },
    });
    if (!material) {
      throw new BadRequestException('El material bibliográfico no existe.');
    }
    if (!material.MatBibAct) {
      throw new BadRequestException('El material bibliográfico está desactivado.');
    }

    // Validar que el autor esté activo
    const autor = await this.prisma.tB_AUTOR.findUnique({
      where: { AutId: createAutorMaterialDto.AutId },
      select: { AutAct: true },
    });
    if (!autor) {
      throw new BadRequestException('El autor no existe.');
    }
    if (!autor.AutAct) {
      throw new BadRequestException('El autor está desactivado.');
    }

    const existente = await this.prisma.tB_AUTOR_MATERIAL.findUnique({
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

    // Si no existe, la creamos
    return this.prisma.tB_AUTOR_MATERIAL.create({
      data: {
        MatBibId: createAutorMaterialDto.MatBibId,
        AutId: createAutorMaterialDto.AutId,
      },
      select: autorMaterialSelect,
    });
  }

  async reactivar(matBibId: number, autId: number): Promise<IAutorMaterial> {
    const existente = await this.prisma.tB_AUTOR_MATERIAL.findUnique({
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

    return this.prisma.tB_AUTOR_MATERIAL.update({
      where: {
        MatBibId_AutId: {
          MatBibId: matBibId,
          AutId: autId,
        },
      },
      data: { AutMatAct: true },
      select: autorMaterialSelect,
    });
  }

  async remove(matBibId: number, autId: number): Promise<IAutorMaterial> {
    return this.prisma.tB_AUTOR_MATERIAL.update({
      where: {
        MatBibId_AutId: {
          MatBibId: matBibId,
          AutId: autId,
        },
      },
      data: { AutMatAct: false },
      select: autorMaterialSelect,
    });
  }
}