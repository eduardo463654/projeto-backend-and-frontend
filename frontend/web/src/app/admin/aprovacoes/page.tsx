"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, X } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAgendamentos, updateAgendamentoStatus } from "@/lib/services";
import type { Agendamento } from "@/lib/types";

export default function AprovacoesPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let refreshing = false;
    let hasLoaded = false;

    const refresh = async () => {
      if (!active || refreshing || document.visibilityState === "hidden") {
        return;
      }

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

  return (
    <AppShell role="admin" title="Aprovações">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" /> Fila de solicitações
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
              Carregando aprovações...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentos
                  .filter((item) => item.status === "pendente")
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.usuario?.nome ?? item.usuarioId}
                      </TableCell>
                      <TableCell>{item.data}</TableCell>
                      <TableCell>{item.ehEad ? "EAD" : "Normal"}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.ehEad
                              ? "bg-violet-100 text-violet-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
          {!loading &&
            !error &&
            agendamentos.every((item) => item.status !== "pendente") && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Não há solicitações pendentes.
              </p>
            )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
