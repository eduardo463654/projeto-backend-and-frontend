import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ValidateIf((user: CreateUserDto) =>
    ['aluno', 'professor', 'monitor'].includes(user.role),
  )
  @IsNotEmpty({ message: 'RA é obrigatório para aluno, professor e monitor.' })
  @IsString()
  @MinLength(6)
  @MaxLength(7)
  @Matches(/\S/, { message: 'RA não pode conter apenas espaços.' })
  ra?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsEnum(['aluno', 'professor', 'funcionario', 'admin', 'monitor'])
  role: 'aluno' | 'professor' | 'funcionario' | 'admin' | 'monitor';
}
