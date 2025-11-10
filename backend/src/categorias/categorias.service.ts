import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { ICategoria } from './interface/categoria.interface';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoriaDto): Promise<ICategoria> {
    const exists = await this.prisma.tB_CATEGORIA.findUnique({
      where: { CatNom: data.CatNom },
    });
    if (exists) {
      throw new BadRequestException('El nombre de la categoría ya está en uso');
    }

    const categoria = await this.prisma.tB_CATEGORIA.create({
      data: {
        CatNom: data.CatNom,
        CatDes: data.CatDes,
        CatAct: data.LecAct ?? true,
      },
      select: {
        CatId: true,
        CatNom: true,
        CatDes: true,
        CatFecCre: true,
        CatFecAct: true,
        CatAct: true,
      },
    });
    return categoria;
  }

  async findAll(): Promise<ICategoria[]> {
    return this.prisma.tB_CATEGORIA.findMany({
      select: {
        CatId: true,
        CatNom: true,
        CatDes: true,
        CatFecCre: true,
        CatFecAct: true,
        CatAct: true,
      },
    });
  }

  async findOne(id: number): Promise<ICategoria> {
    const categoria = await this.prisma.tB_CATEGORIA.findUnique({
      where: { CatId: id },
      select: {
        CatId: true,
        CatNom: true,
        CatDes: true,
        CatFecCre: true,
        CatFecAct: true,
        CatAct: true,
      },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    return categoria;
  }

  async update(id: number, data: UpdateCategoriaDto): Promise<ICategoria> {
    if (data.CatNom) {
      const exists = await this.prisma.tB_CATEGORIA.findFirst({
        where: {
          CatNom: data.CatNom,
          CatId: { not: id },
        },
      });
      if (exists) {
        throw new BadRequestException('El nombre de la categoría ya está en uso');
      }
    }

    const categoria = await this.prisma.tB_CATEGORIA.update({
      where: { CatId: id },
      data: data,
      select: {
        CatId: true,
        CatNom: true,
        CatDes: true,
        CatFecCre: true,
        CatFecAct: true,
        CatAct: true,
      },
    });
    return categoria;
  }

  async remove(id: number): Promise<ICategoria> {
    const categoria = await this.prisma.tB_CATEGORIA.delete({
      where: { CatId: id },
      select: {
        CatId: true,
        CatNom: true,
        CatDes: true,
        CatFecCre: true,
        CatFecAct: true,
        CatAct: true,
      },
    });
    return categoria;
  }
}