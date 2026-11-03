import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail ou RA."),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const cadastroSchema = z
  .object({
    nome: z.string().min(2, "Informe o nome completo."),
    email: z.string().email("Informe um e-mail válido."),
    telefone: z.string().min(10, "Telefone inválido."),
    tipo: z.enum(["aluno", "professor"]),
    ra: z.string().optional(),
    senha: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "aluno" && (!data.ra || data.ra.trim().length < 6)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ra"],
        message: "RA é obrigatório para alunos.",
      });
    }
  });

export const agendamentoAlunoSchema = z.object({
  laboratorioId: z.string().min(1, "Selecione um laboratório."),
  data: z.string().min(1, "Informe a data."),
  periodo: z.enum(["manha", "tarde", "noite"]),
  horaInicio: z.string().min(1, "Informe o horário de início."),
  horaFim: z.string().min(1, "Informe o horário de fim."),
  finalidade: z
    .string()
    .min(10, "Descreva a finalidade com pelo menos 10 caracteres."),
  computadorId: z.string().min(1, "Selecione um computador."),
});

export const agendamentoProfessorSchema = z.object({
  laboratorioId: z.string().min(1, "Selecione um laboratório."),
  data: z.string().min(1, "Informe a data."),
  periodo: z.enum(["manha", "tarde", "noite"]),
  horaInicio: z.string().min(1, "Informe o início."),
  horaFim: z.string().min(1, "Informe o fim."),
  finalidade: z
    .string()
    .min(10, "Descreva a finalidade com pelo menos 10 caracteres."),
  precisaMonitor: z.boolean().optional(),
});
