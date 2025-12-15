import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateLectorDto {
  @ApiProperty({ example: '12345678', description: 'DNI del lector', maxLength: 8 })
  @IsNotEmpty()
  @MaxLength(8)
  readonly LecDni: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del lector', maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  readonly LecNom: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del lector', maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  readonly LecApe: string;

  @ApiProperty({ example: 'estudiante', description: 'Tipo de lector', enum: ['estudiante', 'docente', 'administrativo'] })
  @IsIn(['estudiante', 'docente', 'administrativo'])
  readonly LecTip: string;

  @ApiPropertyOptional({ example: 'lector@email.com', description: 'Correo electrónico del lector' })
  @IsOptional()
  @IsEmail()
  readonly LecEma?: string;

  @ApiPropertyOptional({ example: true, description: 'Indica si el lector está activo' })
  @IsOptional()
  @IsBoolean()
  readonly LecAct?: boolean;
}