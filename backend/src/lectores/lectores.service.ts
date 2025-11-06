import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLectorDto } from './dto/create-lector.dto';
import { UpdateLectoreDto } from './dto/update-lector.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ILector } from './interface/lector.interface';

@Injectable()
export class LectoresService {
  constructor(private prisma:PrismaService){}

  async create(data: CreateLectorDto) :  Promise<ILector> {
    const exits = await this.prisma.tB_LECTOR.findUnique({
      where: {LecDni: data.LecDni},
    })
    if (exits) throw new BadRequestException("El dni ya esta registrado");
    
    const payload = {
      LecDni: data.LecDni,
      LecNom: data.LecNom,
      LecApe: data.LecApe,
      LecTip: data.LecTip,
      LecEma: data.LecEma,
      LecAct: data.LecAct ?? true,
    }
    return await this.prisma.tB_LECTOR.create({ data: payload });
  }

  async findAll() : Promise<ILector[]> {
    const lectores = await this.prisma.tB_LECTOR.findMany({
      select: {
        LecId: true,
        LecDni: true,
        LecNom: true,
        LecApe: true,
        LecTip: true,
        LecEma: true,
        LecFecCre: true,
        LecFecAct: true,
        LecAct: true,
      }
    });
    return lectores;
  }

  async findOne(id: number) : Promise<ILector> {
    const lector = await this.prisma.tB_LECTOR.findUnique({
      where: { LecId: id },
      select: {
        LecId: true,
        LecDni: true,
        LecNom: true,
        LecApe: true,
        LecTip: true,
        LecEma: true,
        LecFecCre: true,
        LecFecAct: true,
        LecAct: true,
      }
    });
    if (!lector) throw new NotFoundException('Lector no encontrado');
    return lector;
  }

  async update(id: number, data: UpdateLectoreDto): Promise<ILector> {
    const lector = await this.prisma.tB_LECTOR.findUnique({ where: { LecId: id } });
    if (!lector) throw new NotFoundException('Lector no encontrado');

    // Validar si el nuevo DNI ya existe en otro lector
    if (data.LecDni) {
      const dniExists = await this.prisma.tB_LECTOR.findUnique({
        where: { LecDni: data.LecDni },
      });
      if (dniExists && dniExists.LecId !== id) {
        throw new BadRequestException('El DNI ya está registrado en otro lector');
      }
    }

    return await this.prisma.tB_LECTOR.update({
      where: { LecId: id },
      data,
      select: {
        LecId: true,
        LecDni: true,
        LecNom: true,
        LecApe: true,
        LecTip: true,
        LecEma: true,
        LecFecCre: true,
        LecFecAct: true,
        LecAct: true,
      }
    });
  }

  async remove(id: number): Promise<ILector> {
    const lector = await this.prisma.tB_LECTOR.findUnique({ where: { LecId: id } });
    if (!lector) throw new NotFoundException('Lector no encontrado');

    return await this.prisma.tB_LECTOR.delete({
      where: { LecId: id },
      select: {
        LecId: true,
        LecDni: true,
        LecNom: true,
        LecApe: true,
        LecTip: true,
        LecEma: true,
        LecFecCre: true,
        LecFecAct: true,
        LecAct: true,
      }
    });
  }
}
