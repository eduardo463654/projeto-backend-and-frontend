"use client";

import { useEffect, useMemo, useState } from "react";
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

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAgendamentos,
  fetchLaboratorios,
  fetchUsuarios,
} from "@/lib/services";
import type { Agendamento, Laboratorio, Usuario } from "@/lib/types";

type StatusFiltro = "todas" | "pendente" | "aprovado" | "recusado";

const filtrosStatus: { value: StatusFiltro; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendente", label: "Pendentes" },
  { value: "aprovado", label: "Aprovadas" },
  { value: "recusado", label: "Recusadas" },
];

function formatarData(data: string) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  const date = dateParts
    ? new Date(
        Number(dateParts[1]),
        Number(dateParts[2]) - 1,
        Number(dateParts[3]),
      )
    : new Date(data);

  if (Number.isNaN(date.getTime())) return data;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AdminDashboardPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todas");

  useEffect(() => {
    let active = true;

    Promise.all([fetchAgendamentos(), fetchLaboratorios(), fetchUsuarios()])
      .then(([agendamentosData, laboratoriosData, usuariosData]) => {
        if (!active) return;
        setAgendamentos(agendamentosData);
        setLaboratorios(laboratoriosData);
        setUsuarios(usuariosData);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o dashboard.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const pendentes = useMemo(
    () => agendamentos.filter((item) => item.status === "pendente").length,
    [agendamentos],
  );

  const aprovados = useMemo(
    () => agendamentos.filter((item) => item.status === "aprovado").length,
    [agendamentos],
  );

  const recusados = useMemo(
    () => agendamentos.filter((item) => item.status === "recusado").length,
    [agendamentos],
  );

  const solicitacoes = useMemo(
    () =>
      agendamentos
        .filter(
          (item) =>
            item.status === "pendente" ||
            item.status === "aprovado" ||
            item.status === "recusado",
        )
        .sort((first, second) => second.criadoEm.localeCompare(first.criadoEm)),
    [agendamentos],
  );

  const solicitacoesVisiveis = useMemo(
    () =>
      statusFiltro === "todas"
        ? solicitacoes
        : solicitacoes.filter((item) => item.status === statusFiltro),
    [solicitacoes, statusFiltro],
  );

  const contagemPorStatus: Record<StatusFiltro, number> = {
    todas: solicitacoes.length,
    pendente: pendentes,
    aprovado: aprovados,
    recusado: recusados,
  };

  const aprovacoesPorLaboratorio = useMemo(
    () =>
      laboratorios
        .map((laboratorio) => ({
          nome: laboratorio.nome,
          total: agendamentos.filter(
            (item) =>
              item.laboratorioId === laboratorio.id &&
              item.status === "aprovado",
          ).length,
        }))
        .filter((laboratorio) => laboratorio.total > 0)
        .sort((first, second) => second.total - first.total),
    [agendamentos, laboratorios],
  );

  const usoPorTipo = useMemo(
    () =>
      [
        {
          nome: "Aluno",
          valor: usuarios.filter((usuario) => usuario.tipo === "aluno").length,
        },
        {
          nome: "Professor",
          valor: usuarios.filter((usuario) => usuario.tipo === "professor")
            .length,
        },
        {
          nome: "Funcionário",
          valor: usuarios.filter((usuario) => usuario.tipo === "funcionario")
            .length,
        },
      ].filter((item) => item.valor > 0),
    [usuarios],
  );

  const chartHeight = Math.max(
    184,
    Math.max(aprovacoesPorLaboratorio.length, usoPorTipo.length) * 56 + 40,
  );

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
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{pendentes}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Aprovações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{aprovados}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Aprovações por laboratório</CardTitle>
                </CardHeader>
                <CardContent style={{ height: chartHeight }}>
                  {aprovacoesPorLaboratorio.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Nenhuma aprovação registrada.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={aprovacoesPorLaboratorio}
                        layout="vertical"
                        margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          stroke="var(--border)"
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          domain={[0, "dataMax + 1"]}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          dataKey="nome"
                          type="category"
                          width={132}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--muted)", opacity: 0.55 }}
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            borderColor: "var(--border)",
                            borderRadius: 8,
                            color: "var(--popover-foreground)",
                          }}
                        />
                        <Bar
                          dataKey="total"
                          name="Aprovações"
                          fill="var(--success)"
                          radius={[0, 5, 5, 0]}
                          maxBarSize={28}
                        >
                          <LabelList
                            dataKey="total"
                            position="right"
                            fill="var(--muted-foreground)"
                            fontSize={11}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uso por tipo de usuário</CardTitle>
                </CardHeader>
                <CardContent style={{ height: chartHeight }}>
                  {usoPorTipo.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Nenhum usuário cadastrado.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usoPorTipo}
                        layout="vertical"
                        margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
                      >
                        <CartesianGrid
                          horizontal={false}
                          stroke="var(--border)"
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          domain={[0, "dataMax + 1"]}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <YAxis
                          dataKey="nome"
                          type="category"
                          width={100}
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--muted)", opacity: 0.55 }}
                          contentStyle={{
                            backgroundColor: "var(--popover)",
                            borderColor: "var(--border)",
                            borderRadius: 8,
                            color: "var(--popover-foreground)",
                          }}
                        />
                        <Bar
                          dataKey="valor"
                          name="Usuários"
                          fill="var(--primary)"
                          radius={[0, 5, 5, 0]}
                          maxBarSize={32}
                        >
                          <LabelList
                            dataKey="valor"
                            position="right"
                            fill="var(--muted-foreground)"
                            fontSize={11}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Solicitações</CardTitle>
                <div
                  aria-label="Filtrar solicitações por status"
                  className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
                  role="group"
                >
                  {filtrosStatus.map((filtro) => (
                    <Button
                      key={filtro.value}
                      type="button"
                      size="sm"
                      variant={
                        statusFiltro === filtro.value ? "default" : "ghost"
                      }
                      aria-pressed={statusFiltro === filtro.value}
                      onClick={() => setStatusFiltro(filtro.value)}
                    >
                      {filtro.label}
                      <span className="ml-1 tabular-nums">
                        {contagemPorStatus[filtro.value]}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Laboratório</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Finalidade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {solicitacoesVisiveis.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {statusFiltro === "todas"
                            ? "Nenhuma solicitação encontrada."
                            : statusFiltro === "pendente"
                              ? "Nenhuma solicitação pendente."
                              : statusFiltro === "aprovado"
                                ? "Nenhuma solicitação aprovada."
                                : "Nenhuma solicitação recusada."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      solicitacoesVisiveis.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.usuario?.nome ?? item.usuarioId}
                          </TableCell>
                          <TableCell>
                            {item.laboratorio?.nome ?? "Não informado"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatarData(item.data)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {item.horaInicio} - {item.horaFim}
                          </TableCell>
                          <TableCell
                            className="max-w-[18rem] truncate"
                            title={item.finalidade}
                          >
                            {item.finalidade}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                item.status === "pendente"
                                  ? "border-amber-200 bg-amber-50 text-amber-800"
                                  : item.status === "aprovado"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-red-200 bg-red-50 text-red-800"
                              }
                            >
                              {item.status === "aprovado"
                                ? "Aprovada"
                                : item.status === "recusado"
                                  ? "Recusada"
                                  : "Pendente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
