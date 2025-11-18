import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialVirtualDto } from './create-material-virtual.dto';

export class UpdateMaterialVirtualDto extends PartialType(CreateMaterialVirtualDto) {}
