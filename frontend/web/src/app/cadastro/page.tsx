"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, UserPlus } from "lucide-react";
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

  const tipo = form.watch("tipo");

  const onSubmit = async (values: z.infer<typeof cadastroSchema>) => {
    try {
      await api.post("/users", {
        name: values.nome,
        phone: values.telefone,
        email: values.email.trim().toLowerCase(),
        password: values.senha,
        ra: values.tipo === "aluno" ? values.ra : undefined,
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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Cadastro
              </p>
              <CardTitle>Criar usuário</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            method="post"
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="space-y-2 md:col-span-2">
              <Label>Nome completo</Label>
              <Input {...form.register("nome")} placeholder="Maria Clara" />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                {...form.register("email")}
                placeholder="maria@instituicao.edu"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo de usuário</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue(
                    "tipo",
                    value as z.infer<typeof cadastroSchema>["tipo"],
                  )
                }
                defaultValue={tipo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aluno">Aluno</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                {...form.register("telefone")}
                placeholder="(11) 99999-9999"
              />
              {form.formState.errors.telefone && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.telefone.message}
                </p>
              )}
            </div>
            {tipo === "aluno" && (
              <div className="space-y-2">
                <Label>RA</Label>
                <Input {...form.register("ra")} placeholder="20240101" />
                {form.formState.errors.ra && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {String(form.formState.errors.ra.message)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label>Senha</Label>
              <Input
                type="password"
                {...form.register("senha")}
                placeholder="Crie uma senha forte"
              />
              {form.formState.errors.senha && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.senha.message}
                </p>
              )}
            </div>
            <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Voltar ao login
              </Link>
              <Button type="submit" disabled={form.formState.isSubmitting}>
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
