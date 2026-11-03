export type TipoUsuario =
  | "aluno"
  | "professor"
  | "funcionario"
  | "admin"
  | "monitor";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  ra?: string;
  tipo: TipoUsuario;
}

export type TipoLaboratorio = "redes" | "informatica";

export interface HorarioFixo {
  id: string;
  laboratorioId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  descricao: string;
}

export interface Laboratorio {
  id: string;
  nome: string;
  tipo: TipoLaboratorio;
  capacidade: number;
  horariosFixos: HorarioFixo[];
}

export type StatusAgendamento =
  | "pendente"
  | "aprovado"
  | "recusado"
  | "cancelado"
  | "aguardando_confirmacao_cancelamento";

export type Periodo = "manha" | "tarde" | "noite";

export interface Agendamento {
  id: string;
  usuarioId: string;
  laboratorioId: string;
  computadorId?: string;
  data: string;
  periodo: Periodo;
  horaInicio: string;
  horaFim: string;
  finalidade: string;
  precisaMonitor: boolean;
  foraDoExpediente: boolean;
  ehEad: boolean;
  status: StatusAgendamento;
  aprovadoPor?: string;
  criadoEm: string;
  laboratorio?: Pick<Laboratorio, "id" | "nome">;
  usuario?: Pick<Usuario, "id" | "nome">;
}

export interface Notificacao {
  id: string;
  agendamentoId: string;
  tipo: "confirmacao_uso" | "cancelamento" | "aprovacao" | "recusa";
  enviadaEm: string;
  respondida: boolean;
  lida: boolean;
}

export type PerfilSessao = TipoUsuario | "visitante";

export interface SessaoUsuario {
  usuario: Usuario;
  role: TipoUsuario;
}
