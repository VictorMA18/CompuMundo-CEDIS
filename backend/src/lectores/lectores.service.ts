import { Injectable } from '@nestjs/common';
import { CreateLectoreDto } from './dto/create-lectore.dto';
import { UpdateLectoreDto } from './dto/update-lectore.dto';

@Injectable()
export class LectoresService {
  create(createLectoreDto: CreateLectoreDto) {
    return 'This action adds a new lectore';
  }

  findAll() {
    return `This action returns all lectores`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lectore`;
  }

  update(id: number, updateLectoreDto: UpdateLectoreDto) {
    return `This action updates a #${id} lectore`;
  }

  remove(id: number) {
    return `This action removes a #${id} lectore`;
  }
}
