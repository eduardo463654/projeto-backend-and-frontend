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
import { usePolling } from "@/lib/use-polling";
import { formatDateTime, getStatusColor } from "@/lib/utils";
import type { Agendamento } from "@/lib/types";

export default function MinhasSolicitacoesAlunoPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchMeusAgendamentos()
      .then((data) => {
        if (active) setAgendamentos(data);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar suas solicitações.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  usePolling(fetchMeusAgendamentos, setAgendamentos);

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
                  <TableHead>Solicitada em</TableHead>
                  <TableHead>Respondida em</TableHead>
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
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(item.criadoEm)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.respondidaEm
                        ? formatDateTime(item.respondidaEm)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
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
