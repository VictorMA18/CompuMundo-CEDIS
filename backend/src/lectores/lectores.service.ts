import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLectorDto } from './dto/create-lector.dto';
import { UpdateLectorDto } from './dto/update-lector.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ILector } from './interface/lector.interface';

const lectorSelect = {
  LecId: true,
  LecDni: true,
  LecNom: true,
  LecApe: true,
  LecTip: true,
  LecEma: true,
  LecFecCre: true,
  LecFecAct: true,
  LecAct: true,
};

@Injectable()
export class LectoresService {
  constructor(private prisma:PrismaService){}

  async create(data: CreateLectorDto): Promise<ILector> {
    const exists = await this.prisma.tB_LECTOR.findUnique({
      where: { LecDni: data.LecDni },
      select: lectorSelect,
    });
    if (exists) {
      if (exists.LecAct) {
        throw new BadRequestException('El DNI ya está registrado');
      } else {
        throw new BadRequestException('El DNI ya existe pero está desactivado. Debe reactivarse.');
      }
    }

    const payload = {
      LecDni: data.LecDni,
      LecNom: data.LecNom,
      LecApe: data.LecApe,
      LecTip: data.LecTip,
      LecEma: data.LecEma,
      LecAct: true,
    };
    return await this.prisma.tB_LECTOR.create({ data: payload, select: lectorSelect });
  }

  async findAll(): Promise<ILector[]> {
    return this.prisma.tB_LECTOR.findMany({
      where: { LecAct: true },
      select: lectorSelect,
      orderBy: { LecId: 'asc' },
    });
  }

  async findAllDesactivados(): Promise<ILector[]> {
    return this.prisma.tB_LECTOR.findMany({
      where: { LecAct: false },
      select: lectorSelect,
      orderBy: { LecId: 'asc' },
    });
  }

  async findOne(id: number): Promise<ILector> {
    const lector = await this.prisma.tB_LECTOR.findUnique({
      where: { LecId: id },
      select: lectorSelect,
    });
    if (!lector) throw new NotFoundException('Lector no encontrado');
    if (!lector.LecAct) throw new BadRequestException('El lector está desactivado');
    return lector;
  }

  async update(id: number, data: UpdateLectorDto): Promise<ILector> {
    await this.findOne(id);

    if (data.LecDni) {
      const dniExists = await this.prisma.tB_LECTOR.findUnique({
        where: { LecDni: data.LecDni },
        select: lectorSelect,
      });
      if (dniExists && dniExists.LecId !== id) {
        if (dniExists.LecAct) {
          throw new BadRequestException('El DNI ya está registrado en otro lector');
        } else {
          throw new BadRequestException('El DNI ya existe en otro lector pero está desactivado. Debe reactivarse.');
        }
      }
    }

    return await this.prisma.tB_LECTOR.update({
      where: { LecId: id },
      data,
      select: lectorSelect,
    });
  }

  async reactivar(id: number): Promise<ILector> {
    const lector = await this.prisma.tB_LECTOR.findUnique({
      where: { LecId: id },
      select: lectorSelect,
    });
    if (!lector) throw new NotFoundException('Lector no encontrado');
    if (lector.LecAct) throw new BadRequestException('El lector ya está activo');

    return this.prisma.tB_LECTOR.update({
      where: { LecId: id },
      data: { LecAct: true },
      select: lectorSelect,
    });
  }

  async remove(id: number): Promise<ILector> {
    await this.findOne(id);
    return this.prisma.tB_LECTOR.update({
      where: { LecId: id },
      data: { LecAct: false },
      select: lectorSelect,
    });
  }
}
