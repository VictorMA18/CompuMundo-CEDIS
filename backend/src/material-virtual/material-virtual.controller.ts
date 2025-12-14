import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { MaterialVirtualService } from './material-virtual.service';
import { CreateMaterialVirtualDto } from './dto/create-material-virtual.dto';
import { UpdateMaterialVirtualDto } from './dto/update-material-virtual.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('material-virtual')
export class MaterialVirtualController {
  constructor(private readonly materialVirtualService: MaterialVirtualService) {}

  @Roles('administrador', 'bibliotecario')
  @Post()
  create(@Body() createMaterialVirtualDto: CreateMaterialVirtualDto) {
    return this.materialVirtualService.create(createMaterialVirtualDto);
  }

  @Get()
  findAll() {
    return this.materialVirtualService.findAll();
  }

  @Get('desactivados')
  findAllDesactivados() {
    return this.materialVirtualService.findAllDesactivados();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialVirtualService.findOne(id);
  }

  @Get('material/:matBibId')
  findByMaterial(@Param('matBibId', ParseIntPipe) matBibId: number) {
    return this.materialVirtualService.findByMaterialBibliografico(matBibId);
  }

  @Roles('administrador', 'bibliotecario')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMaterialVirtualDto: UpdateMaterialVirtualDto) {
    return this.materialVirtualService.update(id, updateMaterialVirtualDto);
  }

  @Roles('administrador', 'bibliotecario')
  @Patch('reactivar/:id')
  reactivar(@Param('id', ParseIntPipe) id: number) {
    return this.materialVirtualService.reactivar(id);
  }

  @Roles('administrador', 'bibliotecario')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialVirtualService.remove(id);
  }
}