"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MonitorPlay,
  MonitorSmartphone,
} from "lucide-react";
import { z } from "zod";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agendamentoAlunoSchema } from "@/lib/schemas";
import {
  createAgendamento,
  fetchDisponibilidade,
  fetchLaboratorios,
} from "@/lib/services";
import type { Laboratorio } from "@/lib/types";

type DisponibilidadeItem = {
  computadorId: string;
  horaInicio: string;
  horaFim: string;
  status:
    | "pendente"
    | "aprovado"
    | "recusado"
    | "cancelado"
    | "aguardando_confirmacao_cancelamento";
};

export default function AgendarComputadorPage() {
  const router = useRouter();
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof agendamentoAlunoSchema>>({
    resolver: zodResolver(agendamentoAlunoSchema),
    defaultValues: {
      laboratorioId: "",
      data: "",
      periodo: "manha",
      horaInicio: "09:00",
      horaFim: "11:00",
      finalidade: "",
      computadorId: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    let active = true;

    fetchLaboratorios()
      .then((laboratorioData) => {
        if (!active) return;
        setLaboratorios(laboratorioData);
        if (laboratorioData[0]) {
          form.setValue("laboratorioId", laboratorioData[0].id, {
            shouldValidate: true,
          });
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar os laboratórios.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [form]);

  const laboratorioId = form.watch("laboratorioId");
  const data = form.watch("data");
  const horaInicio = form.watch("horaInicio");
  const horaFim = form.watch("horaFim");
  const computadorId = form.watch("computadorId");

  useEffect(() => {
    let active = true;

    if (!laboratorioId || !data) {
      setDisponibilidade([]);
      return;
    }

    fetchDisponibilidade(laboratorioId, data)
      .then((items) => {
        if (active) setDisponibilidade(items);
      })
      .catch(() => {
        if (active) setDisponibilidade([]);
      });

    return () => {
      active = false;
    };
  }, [laboratorioId, data]);

  const laboratorioSelecionado = laboratorios.find(
    (item) => item.id === laboratorioId,
  );
  const computadores = Array.from(
    { length: laboratorioSelecionado?.capacidade ?? 0 },
    (_, index) => `PC-${String(index + 1).padStart(2, "0")}`,
  );

  const computadoresOcupados = useMemo(() => {
    if (!laboratorioId || !data || !horaInicio || !horaFim)
      return new Set<string>();

    return new Set(
      disponibilidade
        .filter(
          (item) =>
            item.computadorId &&
            item.status !== "cancelado" &&
            item.status !== "recusado" &&
            item.horaInicio < horaFim &&
            item.horaFim > horaInicio,
        )
        .map((item) => item.computadorId?.toUpperCase()),
    );
  }, [disponibilidade, laboratorioId, data, horaInicio, horaFim]);

  const onSubmit = async (values: z.infer<typeof agendamentoAlunoSchema>) => {
    if (values.horaInicio >= values.horaFim) {
      setError("O horário de fim deve ser posterior ao horário de início.");
      return;
    }

    if (computadoresOcupados.has(values.computadorId.toUpperCase())) {
      setError("Este computador já está reservado para o período informado.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createAgendamento({
        ...values,
        precisaMonitor: false,
        foraDoExpediente:
          values.horaInicio < "08:00" || values.horaFim > "22:00",
        ehEad: false,
      });
      router.push("/aluno/minhas-solicitacoes");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível enviar o agendamento.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell role="aluno" title="Agendar computador">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(380px,.88fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Seleção de computador</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha uma máquina disponível para o período informado.
              </p>
            </div>
            {laboratorioSelecionado && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {computadores.length} computadores
              </span>
            )}
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                Informe a data e os horários ao lado para verificar a
                disponibilidade.
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />{" "}
                    Selecionado
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />{" "}
                    Disponível
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />{" "}
                    Reservado
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {computadores.map((pc) => {
                    const ocupado = computadoresOcupados.has(pc);
                    const selecionado = computadorId === pc;

                    return (
                      <button
                        key={pc}
                        type="button"
                        aria-pressed={selecionado}
                        disabled={ocupado}
                        className={`group relative rounded-xl border p-4 text-center text-sm transition-all ${
                          ocupado
                            ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground opacity-70"
                            : selecionado
                              ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                              : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
                        }`}
                        onClick={() =>
                          form.setValue("computadorId", pc, {
                            shouldValidate: true,
                          })
                        }
                      >
                        {selecionado && (
                          <CheckCircle2 className="absolute right-2 top-2 h-4 w-4" />
                        )}
                        <MonitorSmartphone className="mx-auto mb-2 h-6 w-6" />
                        <span className="font-semibold">{pc}</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          {ocupado ? "Reservado" : "Disponível"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {form.formState.errors.computadorId && (
              <p className="mt-3 text-sm text-red-600">
                {form.formState.errors.computadorId.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes da solicitação</CardTitle>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="laboratorio">Laboratório</Label>
                <Select
                  value={laboratorioId}
                  onValueChange={(value) => {
                    form.setValue("laboratorioId", value, {
                      shouldValidate: true,
                    });
                    form.setValue("computadorId", "", { shouldValidate: true });
                  }}
                >
                  <SelectTrigger id="laboratorio">
                    <SelectValue placeholder="Selecione um laboratório" />
                  </SelectTrigger>
                  <SelectContent>
                    {laboratorios.map((laboratorio) => (
                      <SelectItem key={laboratorio.id} value={laboratorio.id}>
                        {laboratorio.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.laboratorioId && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.laboratorioId.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="data"
                      type="date"
                      className="pl-9"
                      min={new Date().toISOString().split("T")[0]}
                      {...form.register("data")}
                      onChange={(event) => {
                        form.setValue("data", event.target.value, {
                          shouldValidate: true,
                        });
                        form.setValue("computadorId", "", {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </div>
                  {form.formState.errors.data && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.data.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select
                    value={form.watch("periodo")}
                    onValueChange={(value) => {
                      const periodo = value as "manha" | "tarde" | "noite";
                      form.setValue("periodo", periodo, {
                        shouldValidate: true,
                      });
                      if (periodo === "manha") {
                        form.setValue("horaInicio", "09:00");
                        form.setValue("horaFim", "11:00");
                      } else if (periodo === "tarde") {
                        form.setValue("horaInicio", "13:00");
                        form.setValue("horaFim", "15:00");
                      } else {
                        form.setValue("horaInicio", "18:00");
                        form.setValue("horaFim", "20:00");
                      }
                      form.setValue("computadorId", "", {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manha">Manhã</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Início</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    {...form.register("horaInicio")}
                    onChange={(event) => {
                      form.setValue("horaInicio", event.target.value, {
                        shouldValidate: true,
                      });
                      form.setValue("computadorId", "", {
                        shouldValidate: true,
                      });
                    }}
                  />
                  {form.formState.errors.horaInicio && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.horaInicio.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFim">Fim</Label>
                  <Input
                    id="horaFim"
                    type="time"
                    {...form.register("horaFim")}
                    onChange={(event) => {
                      form.setValue("horaFim", event.target.value, {
                        shouldValidate: true,
                      });
                      form.setValue("computadorId", "", {
                        shouldValidate: true,
                      });
                    }}
                  />
                  {form.formState.errors.horaFim && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.horaFim.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalidade">Finalidade</Label>
                <Input
                  id="finalidade"
                  {...form.register("finalidade")}
                  placeholder="Ex.: aula prática de redes TCP/IP"
                />
                {form.formState.errors.finalidade && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.finalidade.message}
                  </p>
                )}
              </div>

              {computadorId && data && (
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Resumo
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <MonitorSmartphone className="h-4 w-4 text-primary" />
                      <strong>{computadorId}</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" /> {data}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" /> {horaInicio}–
                      {horaFim}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <MonitorPlay className="h-4 w-4" /> Necessidade de monitor
                </div>
                <p className="mt-2">
                  Horários fora do expediente (08:00–22:00) dependem de
                  aprovação do monitor.
                </p>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              {!loading && laboratorios.length === 0 && !error && (
                <p className="text-sm text-muted-foreground">
                  Nenhum laboratório disponível.
                </p>
              )}
              <Button
                className="w-full"
                type="submit"
                disabled={
                  submitting ||
                  loading ||
                  laboratorios.length === 0 ||
                  !computadorId
                }
              >
                {submitting ? "Enviando..." : "Enviar agendamento"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
