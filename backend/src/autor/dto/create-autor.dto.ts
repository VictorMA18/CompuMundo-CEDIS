import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateAutorDto {
  @IsString()
  @MaxLength(100)
  readonly AutNom: string;

  @IsString()
  @MaxLength(100)
  readonly AutApe: string;

  @IsString()
  @MaxLength(50)
  readonly AutDoc: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly AutEma?: string;

  @IsOptional()
  @IsBoolean()
  readonly AutAct?: boolean;
}