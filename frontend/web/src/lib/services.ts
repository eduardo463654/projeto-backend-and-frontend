import {
  MOCK_AGENDAMENTOS,
  MOCK_LABORATORIOS,
  MOCK_NOTIFICACOES,
  MOCK_USUARIOS,
} from "@/lib/mock-data";
import { api } from "@/lib/api";
import type {
  Agendamento,
  Laboratorio,
  Notificacao,
  Usuario,
} from "@/lib/types";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

async function withFallback<T>(
  request: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (useMockApi) {
    await delay();
    return fallback;
  }

  return request();
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  return withFallback(() => api.get<Usuario[]>("/users"), MOCK_USUARIOS);
}

export async function fetchLaboratorios(): Promise<Laboratorio[]> {
  return withFallback(
    () => api.get<Laboratorio[]>("/laboratorios"),
    MOCK_LABORATORIOS,
  );
}

export async function fetchAgendamentos(): Promise<Agendamento[]> {
  return withFallback(
    () => api.get<Agendamento[]>("/agendamentos"),
    MOCK_AGENDAMENTOS,
  );
}

export async function fetchMeusAgendamentos(): Promise<Agendamento[]> {
  return withFallback(
    () => api.get<Agendamento[]>("/agendamentos/me"),
    MOCK_AGENDAMENTOS,
  );
}

export async function createAgendamento(
  input: Omit<Agendamento, "id" | "usuarioId" | "status" | "criadoEm">,
) {
  return api.post<Agendamento>("/agendamentos", input);
}

export async function updateAgendamentoStatus(
  id: string,
  status: Agendamento["status"],
) {
  return api.patch<Agendamento>(`/agendamentos/${id}/status`, { status });
}

export async function createLaboratorio(
  input: Pick<Laboratorio, "nome" | "tipo" | "capacidade">,
) {
  return api.post<Laboratorio>("/laboratorios", input);
}

export async function updateLaboratorio(
  id: string,
  input: Pick<Laboratorio, "nome" | "tipo" | "capacidade">,
) {
  return api.put<Laboratorio>(`/laboratorios/${id}`, input);
}

export async function deleteLaboratorio(id: string) {
  return api.del<void>(`/laboratorios/${id}`);
}

export async function updateUsuarioRole(id: string, role: Usuario["tipo"]) {
  return api.patch<Usuario>(`/users/${id}/role`, { role });
}

export async function deleteUsuario(id: string) {
  return api.del<void>(`/users/${id}`);
}

export async function fetchNotificacoes(): Promise<Notificacao[]> {
  return withFallback(
    () => api.get<Notificacao[]>("/notificacoes"),
    MOCK_NOTIFICACOES,
  );
}

export async function fetchDashboardData() {
  const [usuarios, laboratorios, agendamentos] = await Promise.all([
    fetchUsuarios(),
    fetchLaboratorios(),
    fetchAgendamentos(),
  ]);

  return { usuarios, laboratorios, agendamentos };
}
