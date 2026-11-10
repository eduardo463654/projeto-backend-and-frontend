"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, UserPlus } from "lucide-react";
import { z } from "zod";

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
import { api } from "@/lib/api";
import { cadastroSchema } from "@/lib/schemas";

export default function CadastroPage() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const form = useForm<z.infer<typeof cadastroSchema>>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      tipo: "aluno",
      ra: "",
      senha: "",
    },
    mode: "onChange",
  });

  const tipo = useWatch({ control: form.control, name: "tipo" });

  const onSubmit = async (values: z.infer<typeof cadastroSchema>) => {
    try {
      await api.post("/users", {
        name: values.nome,
        phone: values.telefone,
        email: values.email.trim().toLowerCase(),
        password: values.senha,
        ra: values.ra,
        role: values.tipo,
      });

      router.push("/login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o usuário.";
      form.setError("email", { type: "manual", message });
    }
  };

  return (
    <div className="auth-page-background flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl bg-white/95 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:p-8 dark:bg-slate-900">
        <CardHeader className="mb-6 border-b border-border/70 pb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cadastro
              </p>
              <CardTitle className="mt-0.5 text-xl">Criar usuário</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            method="post"
            className="grid gap-x-5 gap-y-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                autoComplete="name"
                {...form.register("nome")}
                placeholder="Maria Clara"
              />
              {form.formState.errors.nome && (
                <p role="alert" className="text-sm text-red-600">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register("email")}
                placeholder="maria@instituicao.edu"
              />
              {form.formState.errors.email && (
                <p role="alert" className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo-usuario">Tipo de usuário</Label>
              <Select
                value={tipo}
                onValueChange={(value) =>
                  form.setValue(
                    "tipo",
                    value as z.infer<typeof cadastroSchema>["tipo"],
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="tipo-usuario" aria-label="Tipo de usuário">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                autoComplete="tel"
                {...form.register("telefone")}
                placeholder="(11) 99999-9999"
              />
              {form.formState.errors.telefone && (
                <p role="alert" className="text-sm text-red-600">
                  {form.formState.errors.telefone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ra">RA</Label>
              <Input
                id="ra"
                autoComplete="off"
                {...form.register("ra")}
                placeholder="Informe seu RA"
              />
              {form.formState.errors.ra && (
                <p
                  role="alert"
                  className="flex items-center gap-2 text-sm text-red-600"
                >
                  <AlertCircle className="h-4 w-4" />
                  {String(form.formState.errors.ra.message)}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-12"
                  {...form.register("senha")}
                  placeholder="Crie uma senha forte"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 text-muted-foreground shadow-none"
                  aria-label={
                    passwordVisible ? "Ocultar senha" : "Mostrar senha"
                  }
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.senha && (
                <p role="alert" className="text-sm text-red-600">
                  {form.formState.errors.senha.message}
                </p>
              )}
            </div>
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border/70 pt-4 sm:col-span-2 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-left"
              >
                Voltar ao login
              </Link>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Cadastrando..."
                  : "Cadastrar usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
