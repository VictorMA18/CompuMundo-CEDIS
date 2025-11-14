import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AutorReferenciaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  AutDoc: string;
}