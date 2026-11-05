"use client";

import { useEffect, useMemo, useState } from "react";
import { getDay, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarCheck2, CalendarClock, UsersRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchAgendamentos,
  fetchLaboratorios,
  fetchUsuarios,
} from "@/lib/services";
import type { Agendamento, Laboratorio, Usuario } from "@/lib/types";

export default function AdminDashboardPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let refreshing = false;
    let hasLoaded = false;

    const refresh = async (initial = false) => {
      if (
        !active ||
        refreshing ||
        (!initial && document.visibilityState === "hidden")
      ) {
        return;
      }

      refreshing = true;
      try {
        if (initial) {
          const [agendamentosData, laboratoriosData, usuariosData] =
            await Promise.all([
              fetchAgendamentos(),
              fetchLaboratorios(),
              fetchUsuarios(),
            ]);
          if (!active) return;
          setLaboratorios(laboratoriosData);
          setUsuarios(usuariosData);
          setAgendamentos(agendamentosData);
        } else {
          const agendamentosData = await fetchAgendamentos();
          if (active) setAgendamentos(agendamentosData);
        }
        if (active) setError("");
      } catch (reason: unknown) {
        if (active && !hasLoaded)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o dashboard.",
          );
      } finally {
        refreshing = false;
        if (active) setLoading(false);
        hasLoaded = true;
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    void refresh(true);
    const intervalId = window.setInterval(() => void refresh(), 5000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const pendentes = useMemo(
    () => agendamentos.filter((item) => item.status === "pendente").length,
    [agendamentos],
  );

  const usoEad = useMemo(
    () => agendamentos.filter((item) => item.ehEad).length,
    [agendamentos],
  );

  const aprovados = useMemo(
    () => agendamentos.filter((item) => item.status === "aprovado").length,
    [agendamentos],
  );

  const pendentesPorDia = useMemo(() => {
    const map = new Map<number, number>();

    agendamentos
      .filter((item) => item.status === "pendente")
      .forEach((item) => {
        const day = getDay(parseISO(item.data));
        map.set(day, (map.get(day) ?? 0) + 1);
      });

    return [
      { dia: "Seg", total: map.get(1) ?? 0 },
      { dia: "Ter", total: map.get(2) ?? 0 },
      { dia: "Qua", total: map.get(3) ?? 0 },
      { dia: "Qui", total: map.get(4) ?? 0 },
      { dia: "Sex", total: map.get(5) ?? 0 },
      { dia: "Sáb", total: map.get(6) ?? 0 },
      { dia: "Dom", total: map.get(0) ?? 0 },
    ];
  }, [agendamentos]);

  const solicitacoesPorLaboratorio = useMemo(() => {
    const usuariosPorId = new Map(
      usuarios.map((usuario) => [usuario.id, usuario.nome]),
    );

    return laboratorios.map((laboratorio) => {
      const solicitacoesPorUsuario = new Map<
        string,
        { nome: string; total: number }
      >();

      agendamentos
        .filter((item) => item.laboratorioId === laboratorio.id)
        .forEach((item) => {
          const solicitacao = solicitacoesPorUsuario.get(item.usuarioId) ?? {
            nome:
              item.usuario?.nome ??
              usuariosPorId.get(item.usuarioId) ??
              "Usuário não identificado",
            total: 0,
          };
          solicitacao.total += 1;
          solicitacoesPorUsuario.set(item.usuarioId, solicitacao);
        });

      const solicitacoes = [...solicitacoesPorUsuario.values()];
      const maiorTotal = Math.max(0, ...solicitacoes.map((item) => item.total));
      const principaisSolicitantes = solicitacoes
        .filter((item) => item.total === maiorTotal && maiorTotal > 0)
        .map((item) => item.nome);

      return {
        laboratorio:
          laboratorio.nome.split("—").pop()?.trim() ?? laboratorio.nome,
        solicitantes: principaisSolicitantes.length
          ? principaisSolicitantes.join(", ")
          : "Sem solicitações",
        total: maiorTotal,
      };
    });
  }, [agendamentos, laboratorios, usuarios]);

  const usuariosPorPerfil = useMemo(() => {
    const perfis: Array<{ tipo: Usuario["tipo"]; nome: string }> = [
      { tipo: "aluno", nome: "Alunos" },
      { tipo: "professor", nome: "Professores" },
      { tipo: "funcionario", nome: "Funcionários" },
      { tipo: "monitor", nome: "Monitores" },
      { tipo: "admin", nome: "Administradores" },
    ];

    return perfis.map(({ tipo, nome }) => ({
      nome,
      total: usuarios.filter((usuario) => usuario.tipo === tipo).length,
    }));
  }, [usuarios]);

  const agendamentosPorStatus = useMemo(() => {
    const status: Array<{ chave: Agendamento["status"]; nome: string }> = [
      { chave: "pendente", nome: "Pendentes" },
      { chave: "aprovado", nome: "Aprovados" },
      { chave: "recusado", nome: "Recusados" },
    ];

    return status.map(({ chave, nome }) => ({
      nome,
      total: agendamentos.filter((item) => item.status === chave).length,
    }));
  }, [agendamentos]);

  return (
    <AppShell role="admin" title="Dashboard administrativo">
      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Carregando dados do dashboard...
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Solicitações pendentes
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">
                      {pendentes}
                    </p>
                  </div>
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Agendamentos aprovados
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">
                      {aprovados}
                    </p>
                  </div>
                  <CalendarCheck2 className="h-5 w-5 text-emerald-600" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Agendamentos EAD
                    </p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums">
                      {usoEad}
                    </p>
                  </div>
                  <UsersRound className="h-5 w-5 text-sky-700" />
                </CardContent>
              </Card>
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Solicitações pendentes por dia
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribuição por dia da semana
                  </p>
                </CardHeader>
                <CardContent className="h-[280px] px-4 pb-5 pt-2">
                  {pendentes > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={pendentesPorDia}
                        margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="#e2e8f0"
                          strokeDasharray="3 4"
                        />
                        <XAxis
                          dataKey="dia"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          tickMargin={10}
                        />
                        <YAxis
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 12 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                          }}
                        />
                        <Bar
                          dataKey="total"
                          name="Solicitações"
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartEmptyState />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Principal solicitante por laboratório
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Solicitações registradas em cada laboratório
                  </p>
                </CardHeader>
                <CardContent className="px-4 pb-5 pt-2">
                  {solicitacoesPorLaboratorio.length > 0 ? (
                    <div
                      style={{
                        height: Math.max(
                          240,
                          solicitacoesPorLaboratorio.length * 48,
                        ),
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={solicitacoesPorLaboratorio}
                          layout="vertical"
                          margin={{ top: 12, right: 112, left: 8, bottom: 0 }}
                        >
                          <CartesianGrid
                            horizontal={false}
                            stroke="#e2e8f0"
                            strokeDasharray="3 4"
                          />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <YAxis
                            dataKey="laboratorio"
                            type="category"
                            width={100}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 12 }}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                            labelFormatter={(label) => `Laboratório: ${label}`}
                            contentStyle={{
                              backgroundColor: "var(--background)",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                            }}
                          />
                          <Bar
                            dataKey="total"
                            name="Solicitações"
                            fill="#0f766e"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={28}
                          >
                            <LabelList
                              dataKey="solicitantes"
                              position="right"
                              fill="#334155"
                              fontSize={12}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[240px]">
                      <ChartEmptyState />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Usuários por perfil
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribuição das contas cadastradas
                  </p>
                </CardHeader>
                <CardContent className="h-[280px] px-4 pb-5 pt-2">
                  {usuarios.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usuariosPorPerfil}
                        layout="vertical"
                        margin={{ top: 12, right: 16, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          stroke="#e2e8f0"
                          strokeDasharray="3 4"
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 12 }}
                        />
                        <YAxis
                          dataKey="nome"
                          type="category"
                          width={112}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 12 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                          }}
                        />
                        <Bar
                          dataKey="total"
                          name="Usuários"
                          fill="#d97706"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartEmptyState />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Agendamentos por status
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visão geral das solicitações
                  </p>
                </CardHeader>
                <CardContent className="h-[280px] px-4 pb-5 pt-2">
                  {agendamentos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={agendamentosPorStatus}
                        layout="vertical"
                        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          stroke="#e2e8f0"
                          strokeDasharray="3 4"
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 12 }}
                        />
                        <YAxis
                          dataKey="nome"
                          type="category"
                          width={132}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                          }}
                        />
                        <Bar
                          dataKey="total"
                          name="Agendamentos"
                          fill="#c2415d"
                          radius={[0, 4, 4, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartEmptyState />
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Sem dados para exibir
    </div>
  );
}
