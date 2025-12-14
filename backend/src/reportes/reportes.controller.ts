import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('morosos/excel')
  @Roles('administrador', 'bibliotecario') // REQ-22 
  async descargarReporteMorosos(@Res() res: Response) {
    const data = await this.reportesService.getReporteMorosos();
    await this.reportesService.generarExcel(data, 'Lectores_Morosos', res);
  }

  @Get('pendientes/excel')
  @Roles('administrador', 'bibliotecario') // REQ-23 
  async descargarReportePendientes(@Res() res: Response) {
    const data = await this.reportesService.getReportePendientes();
    await this.reportesService.generarExcel(data, 'Documentos_Pendientes', res);
  }
  
  // Endpoint para ver JSON simple (útil para frontend antes de descargar)
  @Get('morosos/json')
  @Roles('administrador', 'bibliotecario')
  async verMorososJson() {
    return this.reportesService.getReporteMorosos();
  }
}