import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrestamoDto, TipoPrestamo } from './dto/create-prestamo.dto';
import { calcularFechaVencimiento } from '../common/utils/date.util';
import { DevolverPrestamoDto } from './dto/devolver-prestamo.dto';
import { NotFoundException } from '@nestjs/common'; // Asegúrate de importar esto
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

@Injectable()
export class PrestamosService {
  private readonly logger = new Logger(PrestamosService.name);
  constructor(private prisma: PrismaService) {}

  // Validación: ¿El lector debe algo?
  async validarLectorNoMoroso(lectorId: number) {
    const prestamosVencidos = await this.prisma.tB_PRESTAMO.findFirst({
      where: {
        LecId: lectorId,
        PreEst: 'VENCIDO',
        detalles: {
          some: { PreEst: 'VENCIDO' } // Si tiene al menos un detalle vencido sin devolver
        }
      }
    });

    if (prestamosVencidos) {
      throw new BadRequestException('El lector es moroso. No se pueden crear nuevos préstamos.');
    }
  }

  async create(createPrestamoDto: CreatePrestamoDto, usuarioId: number) {
    // 1. Validar Morosidad
    await this.validarLectorNoMoroso(createPrestamoDto.LecId);

    const fechaInicio = new Date();
    const fechaVencimiento = calcularFechaVencimiento(fechaInicio, 3); // Regla de 3 días

    // 2. Transacción: Todo o Nada
    return await this.prisma.$transaction(async (tx) => {
      
      // A. Crear Cabecera
      const prestamo = await tx.tB_PRESTAMO.create({
        data: {
          LecId: createPrestamoDto.LecId,
          UsuId: usuarioId, // El bibliotecario que hace la operación
          PreFecPre: fechaInicio,
          PreFecVen: fechaVencimiento,
          PreEst: 'VIGENTE',
          PreObs: createPrestamoDto.PreObs,
        },
      });

      // B. Procesar Detalles
      for (const det of createPrestamoDto.detalles) {
        
        // Validaciones Específicas
        if (det.PreTip === TipoPrestamo.FISICO) {
          if (!det.MatFisId) throw new BadRequestException('Préstamo Físico requiere ID de Material Físico');
          
          // Verificar disponibilidad física y bloquearlo
          const fisico = await tx.tB_MATERIAL_FISICO.findUnique({ where: { MatFisId: det.MatFisId } });
          if (!fisico || fisico.MatFisEst !== 'disponible') {
            throw new BadRequestException(`El material físico ID ${det.MatFisId} no está disponible.`);
          }
          
          // Cambiar estado a 'prestado'
          await tx.tB_MATERIAL_FISICO.update({
            where: { MatFisId: det.MatFisId },
            data: { MatFisEst: 'prestado' }
          });
        } 
        else if (det.PreTip === TipoPrestamo.VIRTUAL) {
          if (!det.MatVirId) throw new BadRequestException('Préstamo Virtual requiere ID de Material Virtual');
          // Aquí podrías validar si el usuario ya tiene acceso activo a este material virtual si quisieras
        }

        // C. Crear registro de detalle
        await tx.tB_PRESTAMO_DETALLE.create({
          data: {
            PreId: prestamo.PreId,
            MatBibId: det.MatBibId,
            MatFisId: det.MatFisId,
            MatVirId: det.MatVirId,
            PreTip: det.PreTip,
            PreFecVen: fechaVencimiento, // Hereda la fecha de la cabecera
            PreEst: 'VIGENTE'
          }
        });
      }

      return prestamo;
    });
  }
    
  async findAll() {
    return this.prisma.tB_PRESTAMO.findMany({
      include: {
        lector: true,
        usuario: true,
        detalles: {
          include: {
            materialBibliografico: true, // <-- Trae el título
            materialFisico: true         // <-- Trae el código del ejemplar
          }
        }
      },
      orderBy: {
        PreFecPre: 'desc'
      }
    });
  }

  async devolverDetalle(detalleId: number, devolverDto: DevolverPrestamoDto) {
    // 1. Verificar que el detalle existe
    const detalle = await this.prisma.tB_PRESTAMO_DETALLE.findUnique({
      where: { PreDetId: detalleId },
      include: { prestamo: true } // Traemos al padre para saber el ID del préstamo global
    });

    if (!detalle) throw new NotFoundException('Detalle de préstamo no encontrado');
    if (detalle.PreEst === 'DEVUELTO') throw new BadRequestException('Este ítem ya fue devuelto anteriormente');

    const estadoFinalMaterial = devolverDto.estadoFisico || 'disponible';
    const fechaDevolucion = new Date();

    return await this.prisma.$transaction(async (tx) => {
      // 2. Actualizar el Detalle (Hijo)
      const detalleActualizado = await tx.tB_PRESTAMO_DETALLE.update({
        where: { PreDetId: detalleId },
        data: {
          PreEst: 'DEVUELTO',
          PreFecDev: fechaDevolucion,
        }
      });

      // 3. Liberar el Material Físico (si aplica)
      if (detalle.PreTip === 'FISICO' && detalle.MatFisId) {
        await tx.tB_MATERIAL_FISICO.update({
          where: { MatFisId: detalle.MatFisId },
          data: { MatFisEst: estadoFinalMaterial } // 'disponible' o 'dañado'
        });
      }

      // 4. Verificar si el Préstamo Global (Padre) se puede cerrar
      // Contamos cuántos detalles de este préstamo NO están devueltos todavía
      const pendientes = await tx.tB_PRESTAMO_DETALLE.count({
        where: {
          PreId: detalle.PreId,
          PreEst: { not: 'DEVUELTO' }
        }
      });

      // Si pendientes es 0, significa que este era el último y cerramos el padre
      if (pendientes === 0) {
        await tx.tB_PRESTAMO.update({
          where: { PreId: detalle.PreId },
          data: {
            PreEst: 'DEVUELTO',
            PreFecDev: fechaDevolucion
          }
        });
      }

      return detalleActualizado;
    });
  }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleVencimientos() {
    this.logger.debug('Ejecutando revisión de préstamos vencidos...');
    
    const fechaActual = new Date();

    // 1. Actualizar DETALLES vencidos
    const detallesActualizados = await this.prisma.tB_PRESTAMO_DETALLE.updateMany({
      where: {
        PreEst: 'VIGENTE',    // Solo los que están activos
        PreFecVen: {
          lt: fechaActual     // 'lt' significa 'less than' (menor que hoy)
        }
      },
      data: {
        PreEst: 'VENCIDO'
      }
    });

    // 2. Actualizar CABECERAS (Préstamos globales) vencidas
    const prestamosActualizados = await this.prisma.tB_PRESTAMO.updateMany({
      where: {
        PreEst: 'VIGENTE',
        PreFecVen: {
          lt: fechaActual
        }
      },
      data: {
        PreEst: 'VENCIDO'
      }
    });

    if (detallesActualizados.count > 0 || prestamosActualizados.count > 0) {
      this.logger.warn(`Cron Job Finalizado: Se marcaron ${prestamosActualizados.count} préstamos y ${detallesActualizados.count} libros como VENCIDOS.`);
    } else {
      this.logger.log('Cron Job Finalizado: No se encontraron nuevos vencimientos.');
    }
  }

}