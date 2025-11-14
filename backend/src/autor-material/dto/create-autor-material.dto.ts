import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateAutorMaterialDto {
  @IsInt()
  readonly MatBibId: number;

  @IsInt()
  readonly AutId: number;

  @IsOptional()
  @IsBoolean()
  readonly AutMatAct?: boolean;
}