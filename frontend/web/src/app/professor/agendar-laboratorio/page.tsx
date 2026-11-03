"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { createAgendamento, fetchLaboratorios } from "@/lib/services";
import type { Laboratorio } from "@/lib/types";

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
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });

  const selectDate = (date: Date) => {
    form.setValue(
      "data",
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      { shouldValidate: true },
    );
  };

  return (
    <AppShell role="professor" title="Agendar laboratório">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Calendário de reserva</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <Input type="date" {...form.register("data")} />
                  {form.formState.errors.data && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.data.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select
                    onValueChange={(value) =>
                      form.setValue(
                        "periodo",
                        value as "manha" | "tarde" | "noite",
                      )
                    }
                    defaultValue={form.getValues("periodo")}
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
                  <Input type="time" {...form.register("horaInicio")} />
                  {form.formState.errors.horaInicio && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.horaInicio.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input type="time" {...form.register("horaFim")} />
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
