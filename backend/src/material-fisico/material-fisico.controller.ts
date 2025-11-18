import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MaterialFisicoService } from './material-fisico.service';
import { CreateMaterialFisicoDto } from './dto/create-material-fisico.dto';
import { UpdateMaterialFisicoDto } from './dto/update-material-fisico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('material-fisico')
export class MaterialFisicoController {
  constructor(private readonly materialFisicoService: MaterialFisicoService) {}

  @Roles('administrador', 'bibliotecario')
  @Post()
  create(@Body() createMaterialFisicoDto: CreateMaterialFisicoDto) {
    return this.materialFisicoService.create(createMaterialFisicoDto);
  }

  @Get()
  findAll() {
    return this.materialFisicoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialFisicoService.findOne(+id);
  }

  @Roles('administrador', 'bibliotecario')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMaterialFisicoDto: UpdateMaterialFisicoDto) {
    return this.materialFisicoService.update(+id, updateMaterialFisicoDto);
  }

  @Roles('administrador', 'bibliotecario')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.materialFisicoService.remove(+id);
  }
}