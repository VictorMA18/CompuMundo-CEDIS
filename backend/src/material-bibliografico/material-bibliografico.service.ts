import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialBibliograficoDto } from './dto/create-material-bibliografico.dto';
import { UpdateMaterialBibliograficoDto } from './dto/update-material-bibliografico.dto';
import { AutorMaterialService } from '../autor-material/autor-material.service';
import { IMaterialBibliografico } from './interface/material-bibliografico.interface';

const materialSelect = {
  MatBibId: true,
  MatBibCod: true,
  MatBibTit: true,
  MatBibAno: true,
  CatId: true,
  MatBibFor: true,
  MatBibFecPub: true,
  MatBibFecCre: true,
  MatBibFecAct: true,
  MatBibAct: true,
};

@Injectable()
export class MaterialBibliograficoService {
  constructor(
    private prisma: PrismaService,
    private autorMaterialService: AutorMaterialService,
  ) {}

  private async withAutores(material: IMaterialBibliografico): Promise<IMaterialBibliografico> {
    const autoresMaterial = await this.prisma.tB_AUTOR_MATERIAL.findMany({
      where: { MatBibId: material.MatBibId, AutMatAct: true },
      select: { autor: true },
    });

    return {
      ...material,
      autores: autoresMaterial.map(am => am.autor),
    };
  }

  async create(
    createMaterialBibliograficoDto: CreateMaterialBibliograficoDto,
  ): Promise<IMaterialBibliografico> {
    // Validar unicidad de MatBibCod
    const existente = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibCod: createMaterialBibliograficoDto.MatBibCod },
    });
    if (existente) {
      throw new BadRequestException('El código de material ya existe');
    }

    // Validar existencia de la categoría si se envía CatId
    if (createMaterialBibliograficoDto.CatId) {
      const categoria = await this.prisma.tB_CATEGORIA.findUnique({
        where: { CatId: createMaterialBibliograficoDto.CatId },
      });
      if (!categoria) {
        throw new BadRequestException('La categoría especificada no existe');
      }
    }

    const esAnonimo = !Array.isArray(createMaterialBibliograficoDto.autores);

    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.create({
      data: {
        MatBibCod: createMaterialBibliograficoDto.MatBibCod,
        MatBibTit: createMaterialBibliograficoDto.MatBibTit,
        MatBibAno: esAnonimo,
        CatId: createMaterialBibliograficoDto.CatId,
        MatBibFor: createMaterialBibliograficoDto.MatBibFor,
        MatBibFecPub: createMaterialBibliograficoDto.MatBibFecPub,
      },
      select: materialSelect,
    });

    if (!esAnonimo) {
      for (const autorDto of createMaterialBibliograficoDto.autores!) {
        // Buscar autor por identificador único (por ejemplo, AutDoc)
        const autor = await this.prisma.tB_AUTOR.findUnique({
          where: { AutDoc: autorDto.AutDoc },
          select: { AutId: true },
        });
        if (!autor) {
          throw new NotFoundException(`Autor con identificador ${autorDto.AutDoc} no encontrado`);
        }
        await this.autorMaterialService.create({
          MatBibId: material.MatBibId,
          AutId: autor.AutId,
        });
      }
    }

    return this.withAutores(material);
  }

  async findAll(): Promise<IMaterialBibliografico[]> {
    const materiales = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findMany({
      select: {
        ...materialSelect,
        autoresMaterial: {
          where: { AutMatAct: true },
          select: { autor: true },
        },
      },
    });

    return materiales;
  }

  async findAllDesactivados(): Promise<IMaterialBibliografico[]> {
    const materiales = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findMany({
      where: { MatBibAct: false },
      select: {
        ...materialSelect,
        autoresMaterial: {
          where: { AutMatAct: true },
          select: { autor: true },
        },
      },
    });

    return materiales;
  }

  async findOne(id: number): Promise<IMaterialBibliografico> {
    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: id },
      select: {
        ...materialSelect,
        autoresMaterial: {
          where: { AutMatAct: true },
          select: { autor: true },
        },
      },
    });
    if (!material)
      throw new NotFoundException('Material bibliográfico no encontrado');
    if (!material.MatBibAct)
      throw new BadRequestException('El material bibliográfico está desactivado');

    return material;
  }

  async update(
  id: number,
  updateMaterialBibliograficoDto: UpdateMaterialBibliograficoDto,
  ): Promise<IMaterialBibliografico> {
    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: id },
      select: materialSelect,
    });
    if (!material)
      throw new NotFoundException('Material bibliográfico no encontrado');

    // Validar existencia de la categoría si se envía CatId
    if (updateMaterialBibliograficoDto.CatId) {
      const categoria = await this.prisma.tB_CATEGORIA.findUnique({
        where: { CatId: updateMaterialBibliograficoDto.CatId },
      });
      if (!categoria) {
        throw new BadRequestException('La categoría especificada no existe');
      }
    }

    // Validar unicidad de MatBibCod si se va a actualizar
    if (
      updateMaterialBibliograficoDto.MatBibCod &&
      updateMaterialBibliograficoDto.MatBibCod !== material.MatBibCod
    ) {
      const existente = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
        where: { MatBibCod: updateMaterialBibliograficoDto.MatBibCod },
      });
      if (existente) {
        throw new BadRequestException('El código de material ya existe');
      }
    }

    if (Array.isArray(updateMaterialBibliograficoDto.autores)) {
      await this.prisma.tB_AUTOR_MATERIAL.updateMany({
        where: { MatBibId: id },
        data: { AutMatAct: false },
      });

      for (const autorDto of updateMaterialBibliograficoDto.autores) {
        const autor = await this.prisma.tB_AUTOR.findUnique({
          where: { AutDoc: autorDto.AutDoc },
          select: { AutId: true },
        });
        if (!autor) {
          throw new NotFoundException(`Autor con identificador ${autorDto.AutDoc} no encontrado`);
        }

        const relacion = await this.prisma.tB_AUTOR_MATERIAL.findFirst({
          where: { MatBibId: id, AutId: autor.AutId },
        });

        if (relacion) {
          await this.prisma.tB_AUTOR_MATERIAL.update({
            where: { AutMatId: relacion.AutMatId },
            data: { AutMatAct: true },
          });
        } else {
          await this.autorMaterialService.create({
            MatBibId: id,
            AutId: autor.AutId,
          });
        }
      }

      updateMaterialBibliograficoDto.MatBibAno = false;
    } else {
      await this.prisma.tB_AUTOR_MATERIAL.updateMany({
        where: { MatBibId: id },
        data: { AutMatAct: false },
      });
      updateMaterialBibliograficoDto.MatBibAno = true;
    }

    const updatedMaterial = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.update({
      where: { MatBibId: id },
      data: updateMaterialBibliograficoDto,
      select: materialSelect,
    });

    return this.withAutores(updatedMaterial);
  }

  async reactivar(id: number): Promise<IMaterialBibliografico> {
    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: id },
      select: materialSelect,
    });
    if (!material)
      throw new NotFoundException('Material bibliográfico no encontrado');
    if (material.MatBibAct)
      throw new BadRequestException('El material bibliográfico ya está activo');

    const reactivado = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.update({
      where: { MatBibId: id },
      data: { MatBibAct: true },
      select: materialSelect,
    });

    return this.withAutores(reactivado);
  }

  async remove(id: number): Promise<IMaterialBibliografico> {
    const material = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: id },
      select: materialSelect,
    });
    if (!material)
      throw new NotFoundException('Material bibliográfico no encontrado');
    return this.prisma.tB_MATERIAL_BIBLIOGRAFICO.update({
      where: { MatBibId: id },
      data: { MatBibAct: false },
      select: materialSelect,
    });
  }
}