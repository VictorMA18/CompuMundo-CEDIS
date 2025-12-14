import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

type IntervaloTiempo = 'ANIO' | 'MES' | 'SEMANA';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  // ========== HELPER: construir rango de fechas ==========
  private buildDateRange(inicio?: string, fin?: string, intervalo?: IntervaloTiempo) {
    // Si viene inicio/fin directamente, usar esos valores
    if (inicio || fin) {
      return {
        gte: inicio ? new Date(inicio) : undefined,
        lte: fin ? new Date(fin) : undefined,
      };
    }

    // Si no, calcular según intervalo (semana/mes/año)
    if (intervalo) {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);

      if (intervalo === 'SEMANA') {
        const day = (now.getDay() + 6) % 7; // lunes=0
        start.setDate(now.getDate() - day);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }

      if (intervalo === 'MES') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
      }

      if (intervalo === 'ANIO') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
      }

      return { gte: start, lte: end };
    }

    return undefined;
  }

  // ========== REQ-22: Reporte de Lectores Morosos ==========
  async getReporteMorosos(filtros?: { inicio?: string; fin?: string; intervalo?: IntervaloTiempo }) {
    const rango = this.buildDateRange(filtros?.inicio, filtros?.fin, filtros?.intervalo);

    const morosos = await this.prisma.tB_PRESTAMO.findMany({
      where: {
        PreEst: 'VENCIDO',
        ...(rango ? { PreFecPre: rango } : {}),
      },
      include: {
        lector: true,
        detalles: {
          include: {
            materialBibliografico: true,
          },
        },
      },
    });

    return morosos.map((prestamo) => {
      const hoy = new Date();
      const vencimiento = prestamo.PreFecVen ? new Date(prestamo.PreFecVen) : new Date();
      const diferenciaTiempo = hoy.getTime() - vencimiento.getTime();
      const diasRetraso = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

      return {
        idPrestamo: prestamo.PreId,
        lector: `${prestamo.lector.LecNom} ${prestamo.lector.LecApe}`,
        dni: prestamo.lector.LecDni,
        tipoLector: prestamo.lector.LecTip,
        fechaPrestamo: prestamo.PreFecPre,
        fechaVencimiento: prestamo.PreFecVen,
        diasRetraso: diasRetraso > 0 ? diasRetraso : 0,
        estado: prestamo.PreEst,
      };
    });
  }

  // ========== REQ-23: Reporte de Documentos Pendientes ==========
  async getReportePendientes(filtros?: { inicio?: string; fin?: string; intervalo?: IntervaloTiempo }) {
    const rango = this.buildDateRange(filtros?.inicio, filtros?.fin, filtros?.intervalo);

    const pendientes = await this.prisma.tB_PRESTAMO_DETALLE.findMany({
      where: {
        OR: [{ PreEst: 'VIGENTE' }, { PreEst: 'VENCIDO' }],
        ...(rango ? { PreFecPre: rango } : {}),
      },
      include: {
        materialBibliografico: true,
        prestamo: {
          include: { lector: true },
        },
      },
    });

    return pendientes.map((detalle) => ({
      titulo: detalle.materialBibliografico.MatBibTit,
      codigo: detalle.materialBibliografico.MatBibCod || 'S/C',
      lector: `${detalle.prestamo.lector.LecNom} ${detalle.prestamo.lector.LecApe}`,
      fechaVencimiento: detalle.PreFecVen,
      estado: detalle.PreEst,
    }));
  }

  // ========== REQ-24: Reporte de Lectores por Documento ==========
  async getReporteLectoresPorDocumento(filtros?: {
    MatBibCod?: string;
    MatBibId?: number;
    inicio?: string;
    fin?: string;
    intervalo?: IntervaloTiempo;
  }) {
    // Validar que al menos uno (código o id) esté presente
    if (!filtros?.MatBibCod && !filtros?.MatBibId) {
      throw new BadRequestException('Debe proporcionar MatBibCod o MatBibId para filtrar por documento');
    }

    const rango = this.buildDateRange(filtros?.inicio, filtros?.fin, filtros?.intervalo);

    const whereMaterial: any = {};
    if (filtros?.MatBibId) whereMaterial.MatBibId = filtros.MatBibId;
    if (filtros?.MatBibCod) whereMaterial.MatBibCod = filtros.MatBibCod;

    const detalles = await this.prisma.tB_PRESTAMO_DETALLE.findMany({
      where: {
        ...(rango ? { PreFecPre: rango } : {}),
        materialBibliografico: whereMaterial,
      },
      include: {
        prestamo: { include: { lector: true } },
        materialBibliografico: true,
      },
    });

    // Agrupar por lector y contar número de préstamos
    const map = new Map<string, any>();
    for (const d of detalles) {
      const l = d.prestamo.lector;
      const key = l.LecDni;
      const prev = map.get(key) ?? {
        nombres: `${l.LecNom} ${l.LecApe}`,
        dni: l.LecDni,
        correo: l.LecEma ?? 'S/C',
        numeroPrestamos: 0,
      };
      prev.numeroPrestamos += 1;
      map.set(key, prev);
    }

    return [...map.values()];
  }

  // ========== EXPORTACIÓN EXCEL ==========
  async generarExcel(data: any[], nombreHoja: string, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(nombreHoja);

    if (data.length === 0) {
      worksheet.addRow(['No se encontraron datos para este reporte']);
    } else {
      const columnas = Object.keys(data[0]).map((key) => ({
        header: key.toUpperCase(),
        key: key,
        width: 25,
      }));
      worksheet.columns = columnas;
      worksheet.addRows(data);

      // Estilo: Negrita en encabezados
      worksheet.getRow(1).font = { bold: true };
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${nombreHoja}_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  // ========== EXPORTACIÓN PDF ==========
  async generarPDF(data: any[], nombre: string, res: Response) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${nombre}_${Date.now()}.pdf`);

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(16).text(`Reporte: ${nombre}`, { align: 'center' });
    doc.moveDown();

    if (!data || data.length === 0) {
      doc.fontSize(12).text('No se encontraron datos para este reporte.');
      doc.end();
      return;
    }

    // Cabeceras
    const keys = Object.keys(data[0]);
    doc.fontSize(10).text(keys.join(' | '), { continued: false });
    doc.moveDown(0.5);

    // Filas
    for (const row of data) {
      const line = keys.map((k) => String(row[k] ?? '')).join(' | ');
      doc.text(line);
    }

    doc.end();
  }
}