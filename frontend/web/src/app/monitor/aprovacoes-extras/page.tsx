"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAgendamentos, updateAgendamentoStatus } from "@/lib/services";
import type { Agendamento } from "@/lib/types";

export default function MonitorAprovacoesPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let refreshing = false;
    let hasLoaded = false;

    const refresh = async () => {
      if (!active || refreshing || document.visibilityState === "hidden")
        return;

      refreshing = true;
      try {
        const data = await fetchAgendamentos();
        if (active) {
          setAgendamentos(data);
          setError("");
        }
      } catch (reason: unknown) {
        if (active && !hasLoaded)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar a fila.",
          );
      } finally {
        refreshing = false;
        hasLoaded = true;
        if (active) setLoading(false);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    void refresh();
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

  const decidir = async (id: string, status: "aprovado" | "recusado") => {
    setActionId(id);
    setError("");

    try {
      const updated = await updateAgendamentoStatus(id, status);
      setAgendamentos((items) =>
        items.map((item) => (item.id === id ? updated : item)),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar a solicitação.",
      );
    } finally {
      setActionId(null);
    }
  };

  const fila = agendamentos.filter(
    (item) => item.foraDoExpediente && item.status === "pendente",
  );

  return (
    <AppShell role="monitor" title="Aprovações extras">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Solicitações
            fora do expediente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando aprovações extras...
            </p>
          ) : (
            <div className="space-y-3">
              {fila.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {item.usuario?.nome ?? "Solicitante"} · {item.finalidade}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.laboratorio?.nome ?? item.laboratorioId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.data} · {item.horaInicio} às {item.horaFim}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-100 text-amber-800">
                      Pendente
                    </Badge>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={actionId !== null}
                      onClick={() => decidir(item.id, "aprovado")}
                    >
                      <Check className="mr-1 h-4 w-4" /> Aprovar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={actionId !== null}
                      onClick={() => decidir(item.id, "recusado")}
                    >
                      <X className="mr-1 h-4 w-4" /> Recusar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && fila.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Não há solicitações extras pendentes.
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
