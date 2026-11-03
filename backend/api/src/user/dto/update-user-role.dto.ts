import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @IsEnum(['aluno', 'professor', 'funcionario', 'admin', 'monitor'])
  role: 'aluno' | 'professor' | 'funcionario' | 'admin' | 'monitor';
}
