"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAgendamentos, fetchLaboratorios } from "@/lib/services";
import type { Agendamento, Laboratorio } from "@/lib/types";

function mondayOf(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CalendarioAdminPage() {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [laboratorioId, setLaboratorioId] = useState("");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<Agendamento | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([fetchLaboratorios(), fetchAgendamentos()])
      .then(([laboratorioData, agendamentoData]) => {
        if (!active) return;
        setLaboratorios(laboratorioData);
        setAgendamentos(agendamentoData);
        if (laboratorioData[0]) setLaboratorioId(laboratorioData[0].id);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o calendário.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        return date;
      }),
    [weekStart],
  );

  const weekLabel = `${days[0]?.toLocaleDateString("pt-BR")} – ${days[6]?.toLocaleDateString("pt-BR")}`;

  return (
    <AppShell role="admin" title="Calendário administrativo">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Calendário da semana · {weekLabel}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Semana anterior"
              onClick={() =>
                setWeekStart((date) => {
                  const next = new Date(date);
                  next.setDate(next.getDate() - 7);
                  return next;
                })
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWeekStart(mondayOf(new Date()))}
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Próxima semana"
              onClick={() =>
                setWeekStart((date) => {
                  const next = new Date(date);
                  next.setDate(next.getDate() + 7);
                  return next;
                })
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select value={laboratorioId} onValueChange={setLaboratorioId}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Selecione laboratório" />
              </SelectTrigger>
              <SelectContent>
                {laboratorios.map((laboratorio) => (
                  <SelectItem key={laboratorio.id} value={laboratorio.id}>
                    {laboratorio.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando calendário...
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {days.map((date) => {
                const dayBookings = agendamentos
                  .filter(
                    (item) =>
                      item.laboratorioId === laboratorioId &&
                      item.data === dateKey(date) &&
                      item.status !== "cancelado" &&
                      item.status !== "recusado",
                  )
                  .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
                return (
                  <section
                    key={dateKey(date)}
                    className="min-h-44 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <h2 className="mb-3 text-sm font-semibold">
                      {date.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </h2>
                    {dayBookings.length ? (
                      <div className="space-y-2">
                        {dayBookings.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={`Ver agendamento de ${item.usuario?.nome ?? "usuário"}, ${item.horaInicio} a ${item.horaFim}`}
                            onClick={() => setSelectedBooking(item)}
                            className="w-full rounded-md border border-border bg-card p-2 text-left text-xs transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <p className="font-medium">
                              {item.horaInicio}–{item.horaFim}
                            </p>
                            <p className="mt-1 truncate">
                              {item.usuario?.nome ?? item.finalidade}
                            </p>
                            <p className="text-muted-foreground">
                              {item.status}{" "}
                              {item.computadorId
                                ? `· ${item.computadorId}`
                                : "· laboratório"}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Sem reservas
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={selectedBooking !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
      >
        <DialogContent aria-labelledby="agendamento-detail-title">
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Detalhes do agendamento
                </p>
                <h2
                  id="agendamento-detail-title"
                  className="mt-1 text-lg font-semibold"
                >
                  {selectedBooking.usuario?.nome ?? "Usuário"}
                </h2>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Data</dt>
                  <dd>
                    {new Date(
                      `${selectedBooking.data}T12:00:00`,
                    ).toLocaleDateString("pt-BR")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Horário</dt>
                  <dd>
                    {selectedBooking.horaInicio}–{selectedBooking.horaFim}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Laboratório</dt>
                  <dd>
                    {laboratorios.find(
                      (item) => item.id === selectedBooking.laboratorioId,
                    )?.nome ??
                      selectedBooking.laboratorio?.nome ??
                      "Não identificado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="capitalize">{selectedBooking.status}</dd>
                </div>
                {selectedBooking.computadorId && (
                  <div>
                    <dt className="text-muted-foreground">Computador</dt>
                    <dd>{selectedBooking.computadorId}</dd>
                  </div>
                )}
              </dl>
              <div className="border-t border-border pt-3">
                <h3 className="text-sm font-medium">Finalidade</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {selectedBooking.finalidade}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
