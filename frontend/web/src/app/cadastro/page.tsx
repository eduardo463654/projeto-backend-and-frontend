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
        ra: ["aluno", "professor", "monitor"].includes(values.tipo)
          ? values.ra?.trim()
          : undefined,
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
    <div className="flex min-h-screen items-center justify-center bg-[#cbd5e1] px-4 py-10">
      <Card className="w-full max-w-2xl border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
        <CardHeader className="pb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Cadastro
              </p>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Criar usuário
              </CardTitle>
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
              <Label className="font-medium text-slate-700">
                Nome completo
              </Label>
              <Input
                {...form.register("nome")}
                placeholder="Maria Clara"
                className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:bg-white"
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-slate-700">E-mail</Label>
              <Input
                {...form.register("email")}
                placeholder="maria@instituicao.edu"
                className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:bg-white"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-slate-700">
                Tipo de usuário
              </Label>
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
                  <SelectItem value="monitor">Monitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-slate-700">Telefone</Label>
              <Input
                {...form.register("telefone")}
                placeholder="(11) 99999-9999"
                className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:bg-white"
              />
              {form.formState.errors.telefone && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.telefone.message}
                </p>
              )}
            </div>
            {["aluno", "professor", "monitor"].includes(tipo) && (
              <div className="space-y-2">
                <Label htmlFor="ra" className="font-medium text-slate-700">
                  RA
                </Label>
                <Input
                  id="ra"
                  {...form.register("ra")}
                  placeholder="Informe seu RA"
                  className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:bg-white"
                />
                {form.formState.errors.ra && (
                  <p className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {String(form.formState.errors.ra.message)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label className="font-medium text-slate-700">Senha</Label>
              <Input
                type="password"
                {...form.register("senha")}
                placeholder="Crie uma senha forte"
                className="border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus-visible:bg-white"
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
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
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
