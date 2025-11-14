import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MaterialBibliograficoService } from './material-bibliografico.service';
import { CreateMaterialBibliograficoDto } from './dto/create-material-bibliografico.dto';
import { UpdateMaterialBibliograficoDto } from './dto/update-material-bibliografico.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('material-bibliografico')
export class MaterialBibliograficoController {
  constructor(private readonly materialBibliograficoService: MaterialBibliograficoService) {}

  @Roles("administrador", "bibliotecario")
  @Post()
  create(@Body() createMaterialBibliograficoDto: CreateMaterialBibliograficoDto) {
    return this.materialBibliograficoService.create(createMaterialBibliograficoDto);
  }

  @Get()
  findAll() {
    return this.materialBibliograficoService.findAll();
  }

  @Get('desactivados')
  findAllDesactivados() {
    return this.materialBibliograficoService.findAllDesactivados();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialBibliograficoService.findOne(+id);
  }

  @Roles("administrador", "bibliotecario")
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaterialBibliograficoDto: UpdateMaterialBibliograficoDto) {
    return this.materialBibliograficoService.update(+id, updateMaterialBibliograficoDto);
  }

  @Roles("administrador", "bibliotecario")
  @Patch('reactivar/:id')
  reactivar(@Param('id') id: string) {
    return this.materialBibliograficoService.reactivar(+id);
  }
  
  @Roles("administrador", "bibliotecario")
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materialBibliograficoService.remove(+id);
  }
}