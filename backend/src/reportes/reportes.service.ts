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
    if (inicio || fin) {
      return {
        gte: inicio ? new Date(inicio) : undefined,
        lte: fin ? new Date(fin) : undefined,
      };
    }

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
      } else if (intervalo === 'MES') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
      } else if (intervalo === 'ANIO') {
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
      },
    });

    return morosos.map((prestamo) => {
      const hoy = new Date();
      const vencimiento = prestamo.PreFecVen ? new Date(prestamo.PreFecVen) : new Date();
      const diferenciaTiempo = hoy.getTime() - vencimiento.getTime();
      const diasRetraso = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

      return {
        ID: prestamo.PreId,
        LECTOR: `${prestamo.lector.LecNom} ${prestamo.lector.LecApe}`,
        DNI: prestamo.lector.LecDni,
        'FECHA VENC.': prestamo.PreFecVen ? prestamo.PreFecVen.toISOString().split('T')[0] : 'S/F',
        RETRASO: `${diasRetraso > 0 ? diasRetraso : 0} días`,
        ESTADO: prestamo.PreEst,
      };
    });
  }

  // ========== REQ-23: Reporte de Documentos Pendientes ==========
  async getReportePendientes(filtros?: { inicio?: string; fin?: string; intervalo?: IntervaloTiempo }) {
    const rango = this.buildDateRange(filtros?.inicio, filtros?.fin, filtros?.intervalo);

    const whereInput: any = {
      OR: [{ PreEst: 'VIGENTE' }, { PreEst: 'VENCIDO' }],
    };

    if (rango) {
      whereInput.prestamo = { PreFecPre: rango };
    }

    const pendientes = await this.prisma.tB_PRESTAMO_DETALLE.findMany({
      where: whereInput,
      include: {
        materialBibliografico: true,
        prestamo: { include: { lector: true } },
      },
    });

    return pendientes.map((detalle) => ({
      TITULO: detalle.materialBibliografico?.MatBibTit || 'Sin Título',
      CODIGO: detalle.materialBibliografico?.MatBibCod || 'S/C',
      LECTOR: `${detalle.prestamo.lector.LecNom} ${detalle.prestamo.lector.LecApe}`,
      'FECHA PREST.': detalle.prestamo.PreFecPre ? detalle.prestamo.PreFecPre.toISOString().split('T')[0] : '-',
      ESTADO: detalle.PreEst,
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
    if (!filtros?.MatBibCod && !filtros?.MatBibId) {
      throw new BadRequestException('Debe proporcionar MatBibCod o MatBibId');
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
      },
    });

    const map = new Map<string, any>();
    for (const d of detalles) {
      const l = d.prestamo.lector;
      const key = l.LecDni;
      const prev = map.get(key) ?? {
        NOMBRES: `${l.LecNom} ${l.LecApe}`,
        DNI: l.LecDni,
        CORREO: l.LecEma ?? 'S/C',
        CANTIDAD: 0,
      };
      prev.CANTIDAD += 1;
      map.set(key, prev);
    }

    return [...map.values()];
  }

  // ========== EXPORTACIÓN EXCEL (Mantenido igual) ==========
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
      worksheet.getRow(1).font = { bold: true };
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${nombreHoja}_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  // ========== EXPORTACIÓN PDF MEJORADA ==========
  async generarPDF(data: any[], nombre: string, res: Response) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${nombre}_${Date.now()}.pdf`);

    // 1. Configuración del documento
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' }); // Landscape para tener más espacio horizontal
    doc.pipe(res);

    // 2. Encabezado del Reporte
    doc.fontSize(18).text(`Reporte: ${nombre}`, { align: 'center' });
    doc.fontSize(10).text(`Generado el: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    if (!data || data.length === 0) {
      doc.fontSize(12).text('No se encontraron datos para este reporte.');
      doc.end();
      return;
    }

    // 3. Configuración de la Tabla
    const tableTop = 100;
    const pageHeight = doc.page.height - 50; // Margen inferior
    const startX = 30;
    const rowHeight = 25; // Altura fija de fila
    
    // Obtener keys y calcular ancho de columnas
    const keys = Object.keys(data[0]);
    const columnCount = keys.length;
    const availableWidth = doc.page.width - 60; // Ancho página - márgenes
    const columnWidth = availableWidth / columnCount;

    let currentY = tableTop;

    // Función para dibujar encabezados
    const drawHeaders = (y: number) => {
      // Fondo gris para encabezado
      doc.rect(startX, y, availableWidth, rowHeight).fill('#E0E0E0').stroke();
      
      doc.fillColor('black').font('Helvetica-Bold').fontSize(9);
      keys.forEach((key, i) => {
        doc.text(key.toUpperCase(), startX + (i * columnWidth) + 5, y + 8, {
          width: columnWidth - 10,
          align: 'left',
          ellipsis: true 
        });
      });
      // Línea separadora
      doc.moveTo(startX, y + rowHeight).lineTo(startX + availableWidth, y + rowHeight).stroke();
    };

    // Dibujar primera cabecera
    drawHeaders(currentY);
    currentY += rowHeight;

    // 4. Iterar datos y dibujar filas
    doc.font('Helvetica').fontSize(9);
    
    data.forEach((row, index) => {
      // Verificar si necesitamos nueva página
      if (currentY + rowHeight > pageHeight) {
        doc.addPage({ layout: 'landscape', margin: 30 });
        currentY = 50; // Reiniciar Y en nueva página
        drawHeaders(currentY); // Redibujar cabeceras
        currentY += rowHeight;
        doc.font('Helvetica').fontSize(9); // Restaurar fuente normal
      }

      // Color de fondo alternado (Zebra striping)
      if (index % 2 === 0) {
        doc.rect(startX, currentY, availableWidth, rowHeight).fill('#F9F9F9').opacity(1);
      }
      
      doc.fillColor('black');

      // Dibujar celdas
      keys.forEach((key, i) => {
        let cellText = row[key];

        // Formatear Fechas o Nulos
        if (cellText instanceof Date) {
            cellText = cellText.toISOString().split('T')[0];
        } else if (cellText === null || cellText === undefined) {
            cellText = '-';
        } else {
            cellText = String(cellText);
        }

        doc.text(cellText, startX + (i * columnWidth) + 5, currentY + 8, {
          width: columnWidth - 10,
          align: 'left',
          height: rowHeight - 10,
          ellipsis: true // Cortar texto con "..." si es muy largo para que no rompa la tabla
        });
      });

      // Dibujar línea inferior de la fila (opcional, para separar mejor)
      doc.moveTo(startX, currentY + rowHeight)
         .lineTo(startX + availableWidth, currentY + rowHeight)
         .strokeColor('#EEEEEE')
         .stroke();

      currentY += rowHeight;
    });

    doc.end();
  }
}