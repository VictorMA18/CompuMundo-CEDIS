import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { LectoresService } from './lectores.service';
import { CreateLectorDto } from './dto/create-lector.dto';
import { UpdateLectorDto } from './dto/update-lector.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lectores')
export class LectoresController {
  constructor(private readonly lectoresService: LectoresService) {}

  @Roles("administrador", "bibliotecario")
  @Post()
  create(@Body() createLectoreDto: CreateLectorDto) {
    return this.lectoresService.create(createLectoreDto);
  }

  @Get()
  findAll() {
    return this.lectoresService.findAll();
  }

  @Get('desactivados')
  @Roles("administrador", "bibliotecario")
  findAllDesactivados() {
    return this.lectoresService.findAllDesactivados();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lectoresService.findOne(id);
  }

  @Roles("administrador", "bibliotecario")
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLectoreDto: UpdateLectorDto) {
    return this.lectoresService.update(id, updateLectoreDto);
  }

  @Roles("administrador", "bibliotecario")
  @Patch('reactivar/:id')
  reactivar(@Param('id', ParseIntPipe) id: number) {
    return this.lectoresService.reactivar(id);
  }

  @Roles("administrador", "bibliotecario")
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lectoresService.remove(id);
  }
}