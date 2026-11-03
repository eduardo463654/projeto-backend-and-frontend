"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, clearAuthSession, setAuthSession } from "@/lib/api";
import { loginSchema } from "@/lib/schemas";
import { z } from "zod";

const defaultValues = {
  email: "",
  senha: "",
};

export default function LoginPage() {
  const router = useRouter();
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    clearAuthSession();

    try {
      const payload = await api.post<{
        access_token: string;
        refresh_token: string;
        user: { role: string; email: string; name: string };
      }>("/auth/login", {
        email: values.email.trim().toLowerCase(),
        password: values.senha,
      });

      const role = payload.user.role as
        | "aluno"
        | "professor"
        | "admin"
        | "monitor"
        | "funcionario";
      setAuthSession(payload.access_token, payload.refresh_token, payload.user);

      const destination = {
        aluno: "/aluno/dashboard",
        professor: "/professor/dashboard",
        funcionario: "/professor/dashboard",
        admin: "/admin/dashboard",
        monitor: "/monitor/aprovacoes-extras",
      }[role];
      router.push(destination);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível fazer login.";
      form.setError("email", { type: "manual", message });
      form.setError("senha", { type: "manual", message });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),transparent_25%),linear-gradient(135deg,#0b1830,#101f3d_35%,#eaf3ff)] px-4 py-10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/10 shadow-[0_30px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl md:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-between bg-[linear-gradient(135deg,#0f172a,#0d3b8c_55%,#1d4ed8)] p-8 text-white">
          <div>
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-blue-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              LABORATÓRIO FAP
            </div>
            <h1 className="max-w-xs text-4xl font-bold leading-tight tracking-tight">
              Gestão inteligente do laboratório.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-blue-100/85">
              Controle de agendamentos, ocupação, aprovações e uso do
              laboratório com clareza operacional.
            </p>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-blue-50/90">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              • Aprovações e filas por perfil
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              • Monitoramento de ocupação em tempo real
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              • Fluxo profissional para informática e redes
            </div>
          </div>
        </div>

        <Card className="w-full border-0 bg-card/90 shadow-none">
          <CardHeader className="space-y-2 p-8 pb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-primary">
              Acessar
            </p>
            <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form
              method="post"
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    {...form.register("email")}
                    className="h-12 pl-9 rounded-xl"
                    placeholder="ana@aluno.com"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="senha"
                    type="password"
                    {...form.register("senha")}
                    className="h-12 pl-9 rounded-xl"
                    placeholder="••••••••"
                  />
                </div>
                {form.formState.errors.senha && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.senha.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/cadastro"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Criar conta
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setRecoveryMessage(
                      "A recuperação automática por e-mail não está configurada. Solicite a redefinição ao administrador do sistema.",
                    )
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  Esqueci minha senha
                </button>
              </div>
              {recoveryMessage && (
                <p role="status" className="text-sm text-muted-foreground">
                  {recoveryMessage}
                </p>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl"
                size="lg"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  "Entrando..."
                ) : (
                  <>
                    Entrar <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
