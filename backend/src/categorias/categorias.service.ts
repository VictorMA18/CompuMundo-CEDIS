import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { ICategoria } from './interface/categoria.interface';

const categoriaSelect = {
  CatId: true,
  CatNom: true,
  CatDes: true,
  CatFecCre: true,
  CatFecAct: true,
  CatAct: true,
};

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoriaDto): Promise<ICategoria> {
    const exists = await this.prisma.tB_CATEGORIA.findUnique({
      where: { CatNom: data.CatNom },
      select: categoriaSelect,
    });
    if (exists) {
      if (exists.CatAct) {
        throw new BadRequestException('El nombre de la categoría ya está en uso.');
      } else {
        throw new BadRequestException('El nombre de la categoría ya existe pero está desactivada. Debe reactivarse.');
      }
    }

    const categoria = await this.prisma.tB_CATEGORIA.create({
      data: {
        CatNom: data.CatNom,
        CatDes: data.CatDes,
        CatAct: data.CatAct ?? true,
      },
      select: categoriaSelect,
    });
    return categoria;
  }

  async findAll(): Promise<ICategoria[]> {
    return this.prisma.tB_CATEGORIA.findMany({
      where: { CatAct: true },
      select: categoriaSelect,
      orderBy: { CatId: 'asc' },
    });
  }

  async findAllDesactivadas(): Promise<ICategoria[]> {
    return this.prisma.tB_CATEGORIA.findMany({
      where: { CatAct: false },
      select: categoriaSelect,
      orderBy: { CatId: 'asc' },
    });
  }

  async findOne(id: number): Promise<ICategoria> {
    const categoria = await this.prisma.tB_CATEGORIA.findUnique({
      where: { CatId: id },
      select: categoriaSelect,
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    if (!categoria.CatAct)
      throw new BadRequestException('La categoría está desactivada');
    return categoria;
  }

  async update(id: number, data: UpdateCategoriaDto): Promise<ICategoria> {
    await this.findOne(id);
    if (data.CatNom) {
      const exists = await this.prisma.tB_CATEGORIA.findFirst({
        where: {
          CatNom: data.CatNom,
          CatId: { not: id },
        },
        select: categoriaSelect,
      });
      if (exists) {
        throw new BadRequestException(
          'El nombre de la categoría ya está en uso',
        );
      }
    }

    const updated = await this.prisma.tB_CATEGORIA.update({
      where: { CatId: id },
      data: data,
      select: categoriaSelect,
    });
    return updated;
  }

  async reactivar(id: number): Promise<ICategoria> {
    const categoria = await this.prisma.tB_CATEGORIA.findUnique({
      where: { CatId: id },
      select: categoriaSelect,
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    if (categoria.CatAct)
      throw new BadRequestException('La categoría ya está activa');

    return this.prisma.tB_CATEGORIA.update({
      where: { CatId: id },
      data: { CatAct: true },
      select: categoriaSelect,
    });
  }

  async remove(id: number): Promise<ICategoria> {
    await this.findOne(id);

    return this.prisma.tB_CATEGORIA.update({
      where: { CatId: id },
      data: { CatAct: false },
      select: categoriaSelect,
    });
  }
}