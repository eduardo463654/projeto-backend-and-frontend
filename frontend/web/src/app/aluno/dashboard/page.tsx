"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMeusAgendamentos, fetchLaboratorios } from "@/lib/services";
import type { Agendamento, Laboratorio } from "@/lib/types";

export default function AlunoDashboardPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([fetchMeusAgendamentos(), fetchLaboratorios()])
      .then(([agendamentosData, laboratoriosData]) => {
        if (!active) return;
        setAgendamentos(agendamentosData);
        setLaboratorios(laboratoriosData);
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
    () =>
      agendamentos
        .filter((agendamento) => agendamento.status === "pendente")
        .slice(0, 2),
    [agendamentos],
  );

  const proximo = useMemo(
    () => [...agendamentos].sort((a, b) => a.data.localeCompare(b.data))[0],
    [agendamentos],
  );

  const laboratorioProximo = useMemo(
    () =>
      laboratorios.find(
        (laboratorio) => laboratorio.id === proximo?.laboratorioId,
      ),
    [laboratorios, proximo],
  );

  return (
    <AppShell role="aluno" title="Dashboard">
      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Carregando dashboard do aluno...
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Meus agendamentos pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{pendentes.length}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Solicitações aguardando análise.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Próximo uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">
                    {proximo ? proximo.data : "Sem agendamento"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {laboratorioProximo?.nome ?? "Laboratório não identificado"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Atalho</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => router.push("/aluno/agendar-computador")}
                  >
                    Novo agendamento <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" /> Solicitações recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendentes.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {item.finalidade.slice(0, 36)}...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.data} · {item.horaInicio} às {item.horaFim}
                          </p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800">
                          Pendente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Status geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Aprovados</span>
                      <span className="font-medium">
                        {
                          agendamentos.filter(
                            (item) => item.status === "aprovado",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Em análise</span>
                      <span className="font-medium">
                        {
                          agendamentos.filter(
                            (item) => item.status === "pendente",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Concluídos</span>
                      <span className="font-medium">
                        {
                          agendamentos.filter(
                            (item) =>
                              item.status === "cancelado" ||
                              item.status === "recusado",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Follow-up em dia.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
