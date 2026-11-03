"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
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
import { fetchMeusAgendamentos } from "@/lib/services";
import type { Agendamento } from "@/lib/types";

export default function MinhasSolicitacoesProfessorPage() {
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

  return (
    <AppShell role="professor" title="Minhas solicitações">
      <Card>
        <CardHeader>
          <CardTitle>Solicitações do laboratório</CardTitle>
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
                  <TableHead>Status</TableHead>
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
                          item.status === "aprovado"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {item.status}
                      </Badge>
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
