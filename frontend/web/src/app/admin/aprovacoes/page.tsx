"use client";

import { useEffect, useMemo, useState } from "react";
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

    fetchAgendamentos()
      .then((data) => {
        if (active) setAgendamentos(data);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar a fila.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
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

  const pendentes = useMemo(
    () =>
      agendamentos
        .filter((item) => item.status === "pendente")
        .sort(
          (first, second) =>
            first.data.localeCompare(second.data) ||
            first.horaInicio.localeCompare(second.horaInicio),
        ),
    [agendamentos],
  );

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
                  <TableHead>Laboratório</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendentes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Não há solicitações pendentes.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendentes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.usuario?.nome ?? item.usuarioId}
                      </TableCell>
                      <TableCell>
                        {item.laboratorio?.nome ?? "Laboratório não informado"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.data}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.horaInicio} - {item.horaFim}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.ehEad
                              ? "bg-violet-100 text-violet-800"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {item.ehEad ? "EAD" : "Presencial"}
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
