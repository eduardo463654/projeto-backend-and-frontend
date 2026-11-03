"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppShell } from "@/components/layout/app-shell";
import { fetchMeusAgendamentos } from "@/lib/services";
import type { Agendamento } from "@/lib/types";

export default function MinhasSolicitacoesAlunoPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const recusadas = agendamentos.filter((item) => item.status === "recusado");

  useEffect(() => {
    let active = true;
    let hasLoaded = false;

    const refresh = async () => {
      if (!active || document.visibilityState === "hidden") return;

      try {
        const data = await fetchMeusAgendamentos();
        if (active) {
          setAgendamentos(data);
          setError("");
        }
        hasLoaded = true;
      } catch (reason: unknown) {
        if (active && !hasLoaded)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar suas solicitações.",
          );
      } finally {
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

  return (
    <AppShell role="aluno" title="Minhas solicitações">
      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {error}
            </p>
          )}
          {!loading && recusadas.length > 0 && (
            <p
              role="status"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
            >
              {recusadas.length === 1
                ? "Uma solicitação sua foi recusada. Consulte o status no histórico."
                : `${recusadas.length} solicitações suas foram recusadas. Consulte os status no histórico.`}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando solicitações...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Laboratório</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Finalidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.data}</TableCell>
                    <TableCell>
                      {item.laboratorio?.nome ?? item.laboratorioId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === "pendente"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "aprovado"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "recusado"
                                ? "bg-red-100 text-red-800"
                                : item.status === "cancelado"
                                  ? "bg-slate-200 text-slate-800"
                                  : "bg-red-100 text-red-800"
                        }
                      >
                        {item.status === "recusado"
                          ? "Recusado"
                          : item.status ===
                              "aguardando_confirmacao_cancelamento"
                            ? "Cancelamento pendente"
                            : item.status.charAt(0).toUpperCase() +
                              item.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {item.finalidade}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && !error && agendamentos.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Você ainda não tem solicitações.
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
