import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HorarioFixoDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsInt()
  diaSemana?: number;

  @IsNotEmpty()
  @IsString()
  horaInicio: string;

  @IsNotEmpty()
  @IsString()
  horaFim: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

export class CreateLaboratorioDto {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsEnum(['redes', 'informatica'])
  tipo: 'redes' | 'informatica';

  @IsInt()
  @Min(1)
  capacidade: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioFixoDto)
  horariosFixos?: HorarioFixoDto[];
}

export class UpdateLaboratorioDto extends CreateLaboratorioDto {}
