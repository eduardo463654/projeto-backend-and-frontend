"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MonitorPlay,
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
import { agendamentoProfessorSchema } from "@/lib/schemas";
import {
  createAgendamento,
  fetchDisponibilidade,
  fetchLaboratorios,
} from "@/lib/services";
import type { Laboratorio } from "@/lib/types";

type DisponibilidadeItem = {
  computadorId: string | null;
  horaInicio: string;
  horaFim: string;
  status:
    | "pendente"
    | "aprovado"
    | "recusado"
    | "cancelado"
    | "aguardando_confirmacao_cancelamento";
};

export default function AgendarLaboratorioProfessorPage() {
  const router = useRouter();
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof agendamentoProfessorSchema>>({
    resolver: zodResolver(agendamentoProfessorSchema),
    defaultValues: {
      laboratorioId: "",
      data: "",
      periodo: "tarde",
      horaInicio: "13:00",
      horaFim: "16:00",
      finalidade: "Aula prática para turma.",
      precisaMonitor: true,
    },
    mode: "onChange",
  });

  useEffect(() => {
    let active = true;

    fetchLaboratorios()
      .then((data) => {
        if (!active) return;
        setLaboratorios(data);
        if (data[0]) form.setValue("laboratorioId", data[0].id);
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

  const onSubmit = async (
    values: z.infer<typeof agendamentoProfessorSchema>,
  ) => {
    if (values.horaInicio >= values.horaFim) {
      setError("O horário de fim deve ser posterior ao horário de início.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createAgendamento({
        ...values,
        computadorId: undefined,
        precisaMonitor: values.precisaMonitor ?? false,
        foraDoExpediente:
          values.horaInicio < "08:00" || values.horaFim > "22:00",
        ehEad: false,
      });
      router.push("/professor/minhas-solicitacoes");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível enviar a solicitação.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const laboratorioId = form.watch("laboratorioId");
  const selectedDate = form.watch("data");
  const horaInicio = form.watch("horaInicio");
  const horaFim = form.watch("horaFim");

  const [weekOffset, setWeekOffset] = useState(0);
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeItem[]>(
    [],
  );

  const weekStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [weekOffset]);

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        return date;
      }),
    [weekStart],
  );

  useEffect(() => {
    let active = true;

    if (!laboratorioId || !selectedDate) {
      setDisponibilidade([]);
      return;
    }

    fetchDisponibilidade(laboratorioId, selectedDate)
      .then((items) => {
        if (active) setDisponibilidade(items);
      })
      .catch(() => {
        if (active) setDisponibilidade([]);
      });

    return () => {
      active = false;
    };
  }, [laboratorioId, selectedDate]);

  const selectDate = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    form.setValue("data", key, { shouldValidate: true });
  };

  const horariosDisponiveis = useMemo(() => {
    const options: string[] = [];
    for (let minutes = 8 * 60; minutes <= 22 * 60; minutes += 30) {
      const horas = String(Math.floor(minutes / 60)).padStart(2, "0");
      const mins = String(minutes % 60).padStart(2, "0");
      const time = `${horas}:${mins}`;

      const ocupado = disponibilidade.some(
        (item) =>
          item.status !== "cancelado" &&
          item.status !== "recusado" &&
          item.horaInicio < time &&
          item.horaFim > time,
      );

      if (!ocupado) options.push(time);
    }
    return options;
  }, [disponibilidade]);

  const reservasDoPeriodo = useMemo(() => {
    if (!horaInicio || !horaFim) return [];

    return disponibilidade.filter(
      (item) =>
        item.status !== "cancelado" &&
        item.status !== "recusado" &&
        item.horaInicio < horaFim &&
        item.horaFim > horaInicio,
    );
  }, [disponibilidade, horaInicio, horaFim]);

  return (
    <AppShell role="professor" title="Agendar laboratório">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Calendário de reserva</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha o dia da atividade no laboratório.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Semana anterior"
                disabled={weekOffset <= 0}
                onClick={() => setWeekOffset((value) => value - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Próxima semana"
                onClick={() => setWeekOffset((value) => value + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg border bg-muted/20 px-3 py-2 text-sm font-medium">
              {weekDates[0].toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
              })}
              <span className="text-muted-foreground"> — </span>
              {weekDates[6].toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-7">
              {weekDates.map((date) => {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selectedDate === key}
                    onClick={() => selectDate(date)}
                    className={`rounded-lg border p-3 text-center text-sm ${selectedDate === key ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
                  >
                    <span className="block text-xs text-muted-foreground">
                      {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </span>
                    {date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Selecione uma data para preenchê-la na solicitação. A
              disponibilidade é validada ao enviar.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova reserva</CardTitle>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Laboratório</Label>
                <Select
                  value={laboratorioId}
                  onValueChange={(value) =>
                    form.setValue("laboratorioId", value, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...form.register("data")}
                  />
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
                        form.setValue("horaInicio", "08:00");
                        form.setValue("horaFim", "12:00");
                      } else if (periodo === "tarde") {
                        form.setValue("horaInicio", "13:00");
                        form.setValue("horaFim", "17:00");
                      } else {
                        form.setValue("horaInicio", "18:00");
                        form.setValue("horaFim", "22:00");
                      }
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
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Select
                    value={horaInicio}
                    onValueChange={(value) =>
                      form.setValue("horaInicio", value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis.map((time) => (
                        <SelectItem key={`inicio-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.horaInicio && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.horaInicio.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Select
                    value={horaFim}
                    onValueChange={(value) =>
                      form.setValue("horaFim", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis
                        .filter((time) => time > horaInicio)
                        .map((time) => (
                          <SelectItem key={`fim-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.horaFim && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.horaFim.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Finalidade</Label>
                <Input {...form.register("finalidade")} />
                {form.formState.errors.finalidade && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.finalidade.message}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                A aprovação depende do monitor responsável quando o intervalo
                for fora do expediente padrão.
              </div>
              {selectedDate && (
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Resumo da reserva
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      {horaInicio}–{horaFim}
                    </p>
                    {reservasDoPeriodo.length > 0 ? (
                      <p className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                        <MonitorPlay className="h-4 w-4" />
                        Existem {reservasDoPeriodo.length} reserva(s) no
                        intervalo selecionado.
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Nenhuma reserva conflitante encontrada.
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                disabled={submitting || loading || laboratorios.length === 0}
              >
                {submitting ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
