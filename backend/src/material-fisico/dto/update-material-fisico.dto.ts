import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialFisicoDto } from './create-material-fisico.dto';

export class UpdateMaterialFisicoDto extends PartialType(CreateMaterialFisicoDto) {}
