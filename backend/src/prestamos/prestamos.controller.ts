import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PrestamosService } from './prestamos.service';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Patch, Param } from '@nestjs/common';
import { DevolverPrestamoDto } from './dto/devolver-prestamo.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prestamos')
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  @Post()
  @Roles('administrador', 'bibliotecario') // Solo personal autorizado
  create(@Body() createPrestamoDto: CreatePrestamoDto, @Request() req) {
    // Extraemos el ID del usuario del Token JWT para saber QUIÉN prestó el libro
    const usuarioId = req.user.sub; 
    return this.prestamosService.create(createPrestamoDto, usuarioId);
  }

  @Get()
  @Roles('administrador', 'bibliotecario')
  findAll() {
    return this.prestamosService.findAll();
  }
  @Patch(':id/devolucion') // Ruta: /prestamos/10/devolucion (donde 10 es el ID del DETALLE, no del préstamo global)
  @Roles('administrador', 'bibliotecario')
  devolver(
    @Param('id') id: string, 
    @Body() devolverDto: DevolverPrestamoDto
  ) {
    return this.prestamosService.devolverDetalle(+id, devolverDto);
  }
}