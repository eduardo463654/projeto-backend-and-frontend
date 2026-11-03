"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MonitorPlay, MonitorSmartphone } from "lucide-react";
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
import { createAgendamento, fetchLaboratorios } from "@/lib/services";
import type { Laboratorio } from "@/lib/types";

export default function AgendarComputadorPage() {
  const router = useRouter();
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
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
      computadorId: "PC-03",
    },
    mode: "onChange",
  });

  useEffect(() => {
    let active = true;

    fetchLaboratorios()
      .then((data) => {
        if (!active) return;
        setLaboratorios(data);
        if (data[0]) {
          form.setValue("laboratorioId", data[0].id);
          form.setValue("computadorId", "PC-01");
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
  const laboratorioSelecionado = laboratorios.find(
    (item) => item.id === laboratorioId,
  );
  const computadores = Array.from(
    { length: laboratorioSelecionado?.capacidade ?? 0 },
    (_, index) => `PC-${String(index + 1).padStart(2, "0")}`,
  );

  const onSubmit = async (values: z.infer<typeof agendamentoAlunoSchema>) => {
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
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Seleção de computador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {computadores.map((pc) => (
                <button
                  key={pc}
                  type="button"
                  aria-pressed={form.watch("computadorId") === pc}
                  className={`rounded-lg border p-3 text-center text-sm ${form.watch("computadorId") === pc ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                  onClick={() =>
                    form.setValue("computadorId", pc, { shouldValidate: true })
                  }
                >
                  <MonitorSmartphone className="mx-auto mb-2 h-5 w-5" />
                  {pc}
                </button>
              ))}
              {form.formState.errors.computadorId && (
                <p className="col-span-full text-sm text-red-600">
                  {form.formState.errors.computadorId.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes da solicitação</CardTitle>
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
                    <SelectValue placeholder="Selecione" />
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
                <Input
                  {...form.register("finalidade")}
                  placeholder="Descreva o motivo do uso"
                />
                {form.formState.errors.finalidade && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.finalidade.message}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <MonitorPlay className="h-4 w-4" /> Necessidade de monitor
                </div>
                <p className="mt-2">
                  Se o horário estiver fora do expediente (08:00–22:00), a
                  solicitação depende de aprovação do monitor.
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
                disabled={submitting || loading || laboratorios.length === 0}
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
