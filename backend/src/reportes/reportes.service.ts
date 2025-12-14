import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  // --- 1. LÓGICA DE DATOS (CONSULTAS) ---

  // REQ-22: Reporte de Lectores Morosos
  async getReporteMorosos() {
    const morosos = await this.prisma.tB_PRESTAMO.findMany({
      where: {
        PreEst: 'VENCIDO',
      },
      include: {
        lector: true,
        detalles: {
          include: {
            materialBibliografico: true,
          }
        }
      }
    });

    return morosos.map(prestamo => {
      // CORRECCIÓN AQUÍ: Validamos si existe la fecha antes de usarla
      const hoy = new Date();
      // Si prestamo.PreFecVen es null, usamos 'hoy' para que la diferencia sea 0 y no falle
      const vencimiento = prestamo.PreFecVen ? new Date(prestamo.PreFecVen) : new Date();
      
      const diferenciaTiempo = hoy.getTime() - vencimiento.getTime();
      // Math.ceil redondea hacia arriba, asegurando días completos
      const diasRetraso = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

      return {
        idPrestamo: prestamo.PreId,
        lector: `${prestamo.lector.LecNom} ${prestamo.lector.LecApe}`,
        dni: prestamo.lector.LecDni,
        tipoLector: prestamo.lector.LecTip,
        fechaPrestamo: prestamo.PreFecPre,
        fechaVencimiento: prestamo.PreFecVen,
        diasRetraso: diasRetraso > 0 ? diasRetraso : 0,
        estado: prestamo.PreEst
      };
    });
  }

  // REQ-23: Reporte de Documentos Pendientes
  async getReportePendientes() {
    const pendientes = await this.prisma.tB_PRESTAMO_DETALLE.findMany({
      where: {
        OR: [
            { PreEst: 'VIGENTE' },
            { PreEst: 'VENCIDO' }
        ]
      },
      include: {
        materialBibliografico: true,
        prestamo: {
            include: { lector: true }
        }
      }
    });

    return pendientes.map(detalle => ({
        titulo: detalle.materialBibliografico.MatBibTit,
        codigo: detalle.materialBibliografico.MatBibCod || 'S/C',
        lector: `${detalle.prestamo.lector.LecNom} ${detalle.prestamo.lector.LecApe}`,
        fechaVencimiento: detalle.PreFecVen,
        estado: detalle.PreEst
    }));
  }

  // --- 2. LÓGICA DE EXPORTACIÓN (EXCEL) ---
  
  async generarExcel(data: any[], nombreHoja: string, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(nombreHoja);

    if (data.length === 0) {
        worksheet.addRow(['No se encontraron datos para este reporte']);
    } else {
        const columnas = Object.keys(data[0]).map(key => ({
            header: key.toUpperCase(),
            key: key,
            width: 25
        }));
        worksheet.columns = columnas;
        worksheet.addRows(data);
        
        // Estilo: Negrita en encabezados
        worksheet.getRow(1).font = { bold: true };
    }

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=reporte_${nombreHoja}_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}