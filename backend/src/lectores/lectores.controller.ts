import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LectoresService } from './lectores.service';
import { CreateLectoreDto } from './dto/create-lectore.dto';
import { UpdateLectoreDto } from './dto/update-lectore.dto';

@Controller('lectores')
export class LectoresController {
  constructor(private readonly lectoresService: LectoresService) {}

  @Post()
  create(@Body() createLectoreDto: CreateLectoreDto) {
    return this.lectoresService.create(createLectoreDto);
  }

  @Get()
  findAll() {
    return this.lectoresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lectoresService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLectoreDto: UpdateLectoreDto) {
    return this.lectoresService.update(+id, updateLectoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lectoresService.remove(+id);
  }
}
