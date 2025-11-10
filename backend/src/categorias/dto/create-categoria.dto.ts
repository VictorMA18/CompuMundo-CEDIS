import { IsNotEmpty, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoriaDto {
  @IsNotEmpty()
  @MaxLength(100)
  readonly CatNom: string;

  @IsOptional()
  readonly CatDes?: string;

  @IsOptional()
  @IsBoolean()
  readonly LecAct?: boolean;
}