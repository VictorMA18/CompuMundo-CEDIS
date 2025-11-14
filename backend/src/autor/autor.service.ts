import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutorDto } from './dto/create-autor.dto';
import { UpdateAutorDto } from './dto/update-autor.dto';
import { IAutor } from './interface/autor.interface';

const autorSelect = {
  AutId: true,
  AutNom: true,
  AutApe: true,
  AutEma: true,
  AutAct: true,
  AutFecCre: true,
  AutFecAct: true,
};

@Injectable()
export class AutorService {
  constructor(private prisma: PrismaService) {}

  async create(createAutorDto: CreateAutorDto): Promise<IAutor> {
    const autor = await this.prisma.tB_AUTOR.findFirst({
      where: {
        AutDoc: createAutorDto.AutDoc,
      },
      select: autorSelect,
    });

    if (autor) {
      throw new BadRequestException('El autor ya existe, si está desactivado debe reactivarse.');
    }

    if (createAutorDto.AutEma) {
      const autorCorreo = await this.prisma.tB_AUTOR.findFirst({
        where: {
          AutEma: createAutorDto.AutEma,
        },
        select: { AutId: true },
      });
      if (autorCorreo) {
        throw new BadRequestException('El correo electrónico ya está en uso por otro autor.');
      }
    }

    return this.prisma.tB_AUTOR.create({
      data: createAutorDto,
      select: autorSelect,
    });
  }

  async findAll(): Promise<IAutor[]> {
    return this.prisma.tB_AUTOR.findMany({ select: autorSelect });
  }

  async findAllDesactivados(): Promise<IAutor[]> {
    return this.prisma.tB_AUTOR.findMany({
      where: { AutAct: false },
      select: autorSelect,
    });
  }

  async findOne(id: number): Promise<IAutor> {
    const autor = await this.prisma.tB_AUTOR.findUnique({
      where: { AutId: id },
      select: autorSelect,
    });
    if (!autor) throw new NotFoundException('Autor no encontrado');
    if (!autor.AutAct) throw new BadRequestException('El autor está desactivado');
    return autor;
  }

  async update(id: number, updateAutorDto: UpdateAutorDto): Promise<IAutor> {
    await this.findOne(id);

    if (updateAutorDto.AutEma) {
      const autorCorreo = await this.prisma.tB_AUTOR.findFirst({
        where: {
          AutEma: updateAutorDto.AutEma,
          AutId: { not: id },
        },
        select: { AutId: true },
      });
      if (autorCorreo) {
        throw new BadRequestException('El correo electrónico ya está en uso por otro autor.');
      }
    }

    return this.prisma.tB_AUTOR.update({
      where: { AutId: id },
      data: updateAutorDto,
      select: autorSelect,
    });
  }

  async reactivar(id: number): Promise<IAutor> {
    const autor = await this.prisma.tB_AUTOR.findUnique({
      where: { AutId: id },
      select: autorSelect,
    });
    if (!autor) throw new NotFoundException('Autor no encontrado');
    if (autor.AutAct) throw new BadRequestException('El autor ya está activo');

    return this.prisma.tB_AUTOR.update({
      where: { AutId: id },
      data: { AutAct: true },
      select: autorSelect,
    });
  }

  async remove(id: number): Promise<IAutor> {
    await this.findOne(id);
    return this.prisma.tB_AUTOR.update({
      where: { AutId: id },
      data: { AutAct: false },
      select: autorSelect,
    });
  }
}