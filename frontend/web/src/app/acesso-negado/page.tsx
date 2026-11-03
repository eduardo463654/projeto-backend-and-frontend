"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcessoNegadoPage() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const role = decodeURIComponent(
      document.cookie.match(/(?:^|; )lab_session=([^;]+)/)?.[1] ?? "",
    );
    const dashboardByRole: Record<string, string> = {
      aluno: "/aluno/dashboard",
      professor: "/professor/dashboard",
      funcionario: "/professor/dashboard",
      admin: "/admin/dashboard",
      monitor: "/monitor/aprovacoes-extras",
    };

    setDestination(dashboardByRole[role] ?? "/login");
  }, []);

  const hasSession = destination !== null && destination !== "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-red-500">
            Acesso negado
          </p>
          <CardTitle>Você não tem permissão para acessar esta área.</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {hasSession
              ? "Sua sessão continua ativa, mas esta área pertence a outro perfil. Você não precisa entrar novamente."
              : "Sua sessão não foi encontrada. Entre novamente para continuar."}
          </p>
          <Link
            href={destination ?? "/login"}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {hasSession ? "Voltar ao meu painel" : "Voltar ao login"}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
