import { PartialType } from '@nestjs/mapped-types';
import { CreateLectoreDto } from './create-lectore.dto';

export class UpdateLectoreDto extends PartialType(CreateLectoreDto) {}
