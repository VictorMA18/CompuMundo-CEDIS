import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AutorMaterialService } from './autor-material.service';
import { CreateAutorMaterialDto } from './dto/create-autor-material.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('autor-material')
export class AutorMaterialController {
  constructor(private readonly autorMaterialService: AutorMaterialService) {}

  @Roles("administrador", "bibliotecario")
  @Post()
  async create(@Body() createAutorMaterialDto: CreateAutorMaterialDto) {
    return this.autorMaterialService.create(createAutorMaterialDto);
  }

  @Roles("administrador", "bibliotecario")
  @Delete(':matBibId/:autId')
  async remove(
    @Param('matBibId', ParseIntPipe) matBibId: number,
    @Param('autId', ParseIntPipe) autId: number,
  ) {
    return this.autorMaterialService.remove(matBibId, autId);
  }
}
