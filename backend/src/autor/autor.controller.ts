import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AutorService } from './autor.service';
import { UpdateAutorDto } from './dto/update-autor.dto';
import { CreateAutorDto } from './dto/create-autor.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('autores')
export class AutorController {
  constructor(private readonly autorService: AutorService) {}

  @Roles("administrador", "bibliotecario")
  @Post()
  async create(@Body() createAutorDto: CreateAutorDto) {
    return this.autorService.create(createAutorDto);
  }

  @Get()
  async findAll() {
    return this.autorService.findAll();
  }

  @Get('desactivados')
  async findAllDesactivados() {
    return this.autorService.findAllDesactivados();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.autorService.findOne(id);
  }

  @Roles("administrador", "bibliotecario")
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAutorDto: UpdateAutorDto,
  ) {
    return this.autorService.update(id, updateAutorDto);
  }

  @Roles("administrador", "bibliotecario")
  @Patch('reactivar/:id')
  async reactivar(@Param('id', ParseIntPipe) id: number) {
    return this.autorService.reactivar(id);
  }

  @Roles("administrador", "bibliotecario")
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.autorService.remove(id);
  }
}