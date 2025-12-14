import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FiltrosFechasDto, FiltrosLectoresPorDocumentoDto } from './dto/filtros-reportes.dto';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // ========== REQ-22: Lectores Morosos ==========

  @Get('morosos/json')
  @Roles('administrador', 'bibliotecario')
  verMorososJson(@Query() filtros: FiltrosFechasDto) {
    return this.reportesService.getReporteMorosos(filtros);
  }

  @Get('morosos/excel')
  @Roles('administrador', 'bibliotecario')
  async descargarMorososExcel(@Query() filtros: FiltrosFechasDto, @Res() res: Response) {
    const data = await this.reportesService.getReporteMorosos(filtros);
    await this.reportesService.generarExcel(data, 'Lectores_Morosos', res);
  }

  @Get('morosos/pdf')
  @Roles('administrador', 'bibliotecario')
  async descargarMorososPdf(@Query() filtros: FiltrosFechasDto, @Res() res: Response) {
    const data = await this.reportesService.getReporteMorosos(filtros);
    await this.reportesService.generarPDF(data, 'Lectores_Morosos', res);
  }

  // ========== REQ-23: Documentos Pendientes ==========

  @Get('pendientes/json')
  @Roles('administrador', 'bibliotecario')
  verPendientesJson(@Query() filtros: FiltrosFechasDto) {
    return this.reportesService.getReportePendientes(filtros);
  }

  @Get('pendientes/excel')
  @Roles('administrador', 'bibliotecario')
  async descargarPendientesExcel(@Query() filtros: FiltrosFechasDto, @Res() res: Response) {
    const data = await this.reportesService.getReportePendientes(filtros);
    await this.reportesService.generarExcel(data, 'Documentos_Pendientes', res);
  }

  @Get('pendientes/pdf')
  @Roles('administrador', 'bibliotecario')
  async descargarPendientesPdf(@Query() filtros: FiltrosFechasDto, @Res() res: Response) {
    const data = await this.reportesService.getReportePendientes(filtros);
    await this.reportesService.generarPDF(data, 'Documentos_Pendientes', res);
  }

  // ========== REQ-24: Lectores por Documento ==========

  @Get('lectores-por-documento/json')
  @Roles('administrador', 'bibliotecario')
  lectoresPorDocumentoJson(@Query() filtros: FiltrosLectoresPorDocumentoDto) {
    return this.reportesService.getReporteLectoresPorDocumento(filtros);
  }

  @Get('lectores-por-documento/excel')
  @Roles('administrador', 'bibliotecario')
  async lectoresPorDocumentoExcel(@Query() filtros: FiltrosLectoresPorDocumentoDto, @Res() res: Response) {
    const data = await this.reportesService.getReporteLectoresPorDocumento(filtros);
    await this.reportesService.generarExcel(data, 'Lectores_Por_Documento', res);
  }

  @Get('lectores-por-documento/pdf')
  @Roles('administrador', 'bibliotecario')
  async lectoresPorDocumentoPdf(@Query() filtros: FiltrosLectoresPorDocumentoDto, @Res() res: Response) {
    const data = await this.reportesService.getReporteLectoresPorDocumento(filtros);
    await this.reportesService.generarPDF(data, 'Lectores_Por_Documento', res);
  }
}
