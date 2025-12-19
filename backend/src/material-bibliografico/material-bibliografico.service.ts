import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateMaterialBibliograficoDto } from './dto/create-material-bibliografico.dto';
import { UpdateMaterialBibliograficoDto } from './dto/update-material-bibliografico.dto';
import { AutorMaterialService } from '../autor-material/autor-material.service';
import { IMaterialBibliografico } from './interface/material-bibliografico.interface';
import { IMaterialBibliograficoExtendido } from './interface/material-bibliografico-extendido.interface';
import { CategoriasService } from 'src/categorias/categorias.service';
import { AutorService } from 'src/autor/autor.service';

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
    private categoriaService: CategoriasService,
    private autorService: AutorService
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

  private async withAutores(
    material: IMaterialBibliografico,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialBibliografico> {
    const autoresMaterial = await prismaClient.tB_AUTOR_MATERIAL.findMany({
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
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialBibliografico> {
    return this.withTransaction(async (tx) => {
      const existente = await tx.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
        where: { MatBibCod: createMaterialBibliograficoDto.MatBibCod },
      });
      if (existente) {
        if (existente.MatBibAct) {
          throw new BadRequestException('El código del documento bibliográfico ya existe');
        } else {
          throw new BadRequestException('El código del documento bibliográfico ya existe pero está desactivado. Debe reactivarse.');
        }
      }

      if (createMaterialBibliograficoDto.CatId) {
        await this.categoriaService.findOne(createMaterialBibliograficoDto.CatId, tx);
      }

      const esAnonimo = !Array.isArray(createMaterialBibliograficoDto.autores);

      const material = await tx.tB_MATERIAL_BIBLIOGRAFICO.create({
        data: {
          MatBibCod: createMaterialBibliograficoDto.MatBibCod,
          MatBibTit: createMaterialBibliograficoDto.MatBibTit,
          MatBibAno: esAnonimo,
          MatBibFor: 'NINGUNO',
          CatId: createMaterialBibliograficoDto.CatId,
          MatBibFecPub: createMaterialBibliograficoDto.MatBibFecPub,
        },
        select: materialSelect,
      });

      if (!esAnonimo) {
        for (const autorDto of createMaterialBibliograficoDto.autores!) {
          const autor = await this.autorService.findOneByDoc(autorDto.AutDoc, tx);
          await this.autorMaterialService.create(
            { MatBibId: material.MatBibId, AutId: autor.AutId },
            tx
          );
        }
      }

      return this.withAutores(material, tx);
    }, prismaClient);
  }

  async recalcularFormato(materialId: number, prismaClient: PrismaService | Prisma.TransactionClient = this.prisma) {
    const tieneFisico = await prismaClient.tB_MATERIAL_FISICO.findFirst({
      where: { MatBibId: materialId, MatFisAct: true },
    });
    const tieneVirtual = await prismaClient.tB_MATERIAL_VIRTUAL.findFirst({
      where: { MatBibId: materialId, MatVirAct: true },
    });

    let formato: 'FISICO' | 'VIRTUAL' | 'MIXTO' | 'NINGUNO';
    if (tieneFisico && tieneVirtual) formato = 'MIXTO';
    else if (tieneFisico) formato = 'FISICO';
    else if (tieneVirtual) formato = 'VIRTUAL';
    else formato = 'NINGUNO';

    await prismaClient.tB_MATERIAL_BIBLIOGRAFICO.update({
      where: { MatBibId: materialId },
      data: { MatBibFor: formato },
    });
  }

  async findAll(): Promise<IMaterialBibliograficoExtendido[]> {
    const materiales = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findMany({
      where: { MatBibAct: true },
      select: {
        ...materialSelect,
        autoresMaterial: {
          where: { AutMatAct: true },
          select: {
            autor: {
              select: {
                AutId: true,
                AutNom: true,
                AutApe: true,
                AutDoc: true,
              },
            },
          },
        },
        materialesFisicos: {
          where: { MatFisAct: true },
          select: { MatFisCodEje: true, MatFisEst: true },
        },
        materialVirtual: {
          where: { MatVirAct: true },
          select: { MatVirId: true },
        },
      },
      orderBy: { MatBibId: "asc"}
    });

    return materiales.map(material => {
      const totalFisicos = material.materialesFisicos.length;
      const disponiblesFisicos = material.materialesFisicos.filter(f => f.MatFisEst === 'disponible').length;
      const tieneVirtual = !!material.materialVirtual;
      return {
        ...material,
        totalFisicos,
        disponiblesFisicos,
        tieneVirtual,
      };
    });
  }

  async findAllDesactivados(): Promise<IMaterialBibliograficoExtendido[]> {
    const materiales = await this.prisma.tB_MATERIAL_BIBLIOGRAFICO.findMany({
      where: { MatBibAct: false },
      select: {
        ...materialSelect,
        autoresMaterial: {
          where: { AutMatAct: true },
          select: {
            autor: {
              select: {
                AutId: true,
                AutNom: true,
                AutApe: true,
                AutDoc: true,
              },
            },
          },
        },
        materialesFisicos: {
          where: { MatFisAct: true },
          select: { MatFisEst: true },
        },
        materialVirtual: {
          where: { MatVirAct: true },
          select: { MatVirId: true },
        },
      },
      orderBy: { MatBibId: 'asc' },
    });

    return materiales.map(material => {
      const totalFisicos = material.materialesFisicos.length;
      const disponiblesFisicos = material.materialesFisicos.filter(f => f.MatFisEst === 'disponible').length;
      const tieneVirtual = !!material.materialVirtual;
      return {
        ...material,
        totalFisicos,
        disponiblesFisicos,
        tieneVirtual,
      };
    });
  }

  async findOne(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<IMaterialBibliograficoExtendido> {
    const material = await prismaClient.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
      where: { MatBibId: id },
      select: {
        ...materialSelect,
        autoresMaterial: {
          where: { AutMatAct: true },
          select: {
            autor: {
              select: {
                AutId: true,
                AutNom: true,
                AutApe: true,
                AutDoc: true,
              },
            },
          },
        },
        materialesFisicos: {
          where: { MatFisAct: true },
          select: { MatFisEst: true },
        },
        materialVirtual: {
          where: { MatVirAct: true },
          select: { MatVirId: true },
        },
      },
    });
    if (!material)
      throw new NotFoundException('Documento bibliográfico no encontrado');
    if (!material.MatBibAct)
      throw new BadRequestException('El documento bibliográfico está desactivado');

    const totalFisicos = material.materialesFisicos.length;
    const disponiblesFisicos = material.materialesFisicos.filter(f => f.MatFisEst === 'disponible').length;
    const tieneVirtual = !!material.materialVirtual;

    return {
      ...material,
      totalFisicos,
      disponiblesFisicos,
      tieneVirtual,
    };
  }

async update(
    id: number,
    updateMaterialBibliograficoDto: UpdateMaterialBibliograficoDto,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialBibliografico> {
    return this.withTransaction(async (tx) => {
      const material = await this.findOne(id, tx);

      if (updateMaterialBibliograficoDto.CatId) {
        await this.categoriaService.findOne(updateMaterialBibliograficoDto.CatId, tx);
      }

      if (
        updateMaterialBibliograficoDto.MatBibCod &&
        updateMaterialBibliograficoDto.MatBibCod !== material.MatBibCod
      ) {
        const existente = await tx.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
          where: { MatBibCod: updateMaterialBibliograficoDto.MatBibCod },
        });
        if (existente) {
          throw new BadRequestException('El código del documento bibliográfico ya existe');
        }
      }

      if (Array.isArray(updateMaterialBibliograficoDto.autores)) {
        await tx.tB_AUTOR_MATERIAL.updateMany({
          where: { MatBibId: id },
          data: { AutMatAct: false },
        });

        for (const autorDto of updateMaterialBibliograficoDto.autores) {
          const autor = await this.autorService.findOneByDoc(autorDto.AutDoc, tx);

          const relacion = await tx.tB_AUTOR_MATERIAL.findFirst({
            where: { MatBibId: id, AutId: autor.AutId },
          });

          if (relacion) {
            await tx.tB_AUTOR_MATERIAL.update({
              where: { AutMatId: relacion.AutMatId },
              data: { AutMatAct: true },
            });
          } else {
            await this.autorMaterialService.create(
              { MatBibId: id, AutId: autor.AutId },
              tx
            );
          }
        }

        updateMaterialBibliograficoDto.MatBibAno = false;
      } else {
        await tx.tB_AUTOR_MATERIAL.updateMany({
          where: { MatBibId: id },
          data: { AutMatAct: false },
        });
        updateMaterialBibliograficoDto.MatBibAno = true;
      }

      const {autores, ...data } = updateMaterialBibliograficoDto

      const updatedMaterial = await tx.tB_MATERIAL_BIBLIOGRAFICO.update({
        where: { MatBibId: id },
        data: data,
        select: materialSelect,
      });

      await this.recalcularFormato(id, tx);

      return this.withAutores(updatedMaterial, tx);
      
    }, prismaClient);
  }

  async reactivar(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialBibliografico> {
    return this.withTransaction(async (tx) => {
      const material = await tx.tB_MATERIAL_BIBLIOGRAFICO.findUnique({
        where: { MatBibId: id },
        select: materialSelect,
      });
      if (!material)
        throw new NotFoundException('Documento bibliográfico no encontrado');
      if (material.MatBibAct)
        throw new BadRequestException('El documento bibliográfico ya está activo');

      const reactivado = await tx.tB_MATERIAL_BIBLIOGRAFICO.update({
        where: { MatBibId: id },
        data: { MatBibAct: true },
        select: materialSelect,
      });

      return this.withAutores(reactivado, tx);
    }, prismaClient);
  }

  async remove(
    id: number,
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma
  ): Promise<IMaterialBibliografico> {
    return this.withTransaction(async (tx) => {
      await this.findOne(id, tx);
      return tx.tB_MATERIAL_BIBLIOGRAFICO.update({
        where: { MatBibId: id },
        data: { MatBibAct: false },
        select: materialSelect,
      });
    }, prismaClient);
  }
}