import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialBibliograficoDto } from './create-material-bibliografico.dto';

export class UpdateMaterialBibliograficoDto extends PartialType(CreateMaterialBibliograficoDto) {}
