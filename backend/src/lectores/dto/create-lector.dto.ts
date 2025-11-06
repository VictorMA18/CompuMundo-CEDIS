import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreateLectorDto {
  @IsNotEmpty()
  @MaxLength(8)
  readonly LecDni: string;
  @IsNotEmpty()
  @MaxLength(100)
  readonly LecNom: string;
  @IsNotEmpty()
  @MaxLength(100)
  readonly LecApe: string;
  @IsIn(['estudiante', 'docente', 'administrativo'])
  readonly LecTip: string;
  @IsOptional()
  @IsEmail()
  readonly LecEma?: string;
  @IsOptional()
  @IsBoolean()
  readonly LecAct?: boolean;
}