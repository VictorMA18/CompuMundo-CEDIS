import { PartialType } from '@nestjs/mapped-types';
import { CreateLectorDto } from './create-lector.dto';

export class UpdateLectoreDto extends PartialType(CreateLectorDto) {}
