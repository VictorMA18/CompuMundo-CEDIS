import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAutorMaterialDto {
  @ApiProperty({ example: 1, description: 'ID del material bibliográfico' })
  @IsInt()
  readonly MatBibId: number;

  @ApiProperty({ example: 2, description: 'ID del autor' })
  @IsInt()
  readonly AutId: number;

  @ApiPropertyOptional({ example: true, description: 'Indica si la relación está activa' })
  @IsOptional()
  @IsBoolean()
  readonly AutMatAct?: boolean;
}