import { IsInt, IsString, MaxLength, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateMaterialVirtualDto {
  @IsInt()
  MatBibId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  MatVirUrlAcc: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  MatVirForArc: string;

  @IsOptional()
  @IsBoolean()
  MatVirAct?: boolean;
}