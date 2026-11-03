"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createLaboratorio,
  deleteLaboratorio,
  fetchLaboratorios,
  updateLaboratorio,
} from "@/lib/services";
import type { Laboratorio } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LaboratoriosPage() {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"redes" | "informatica">("informatica");
  const [capacidade, setCapacidade] = useState("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchLaboratorios()
      .then((data) => {
        if (active) setLaboratorios(data);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar os laboratórios.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const abrirNovo = () => {
    setEditingId(null);
    setNome("");
    setTipo("informatica");
    setCapacidade("1");
    setError("");
    setDialogOpen(true);
  };

  const abrirEdicao = (laboratorio: Laboratorio) => {
    setEditingId(laboratorio.id);
    setNome(laboratorio.nome);
    setTipo(laboratorio.tipo);
    setCapacidade(String(laboratorio.capacidade));
    setError("");
    setDialogOpen(true);
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const capacidadeValue = Number(capacidade);

    if (
      !nome.trim() ||
      !Number.isInteger(capacidadeValue) ||
      capacidadeValue < 1
    ) {
      setError("Informe um nome e uma capacidade inteira maior que zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input = { nome: nome.trim(), tipo, capacidade: capacidadeValue };
      const saved = editingId
        ? await updateLaboratorio(editingId, input)
        : await createLaboratorio(input);
      setLaboratorios((items) =>
        editingId
          ? items
              .map((item) => (item.id === saved.id ? saved : item))
              .sort((a, b) => a.nome.localeCompare(b.nome))
          : [...items, saved].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setDialogOpen(false);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar o laboratório.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remover = async (laboratorio: Laboratorio) => {
    if (!window.confirm(`Remover o laboratório ${laboratorio.nome}?`)) return;

    setError("");
    try {
      await deleteLaboratorio(laboratorio.id);
      setLaboratorios((items) =>
        items.filter((item) => item.id !== laboratorio.id),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível remover o laboratório.",
      );
    }
  };

  return (
    <AppShell role="admin" title="Laboratórios">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Gerenciar laboratórios</CardTitle>
          <Button type="button" onClick={abrirNovo}>
            <Plus className="mr-2 h-4 w-4" /> Novo laboratório
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando laboratórios...
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laboratorios.map((laboratorio) => (
                    <TableRow key={laboratorio.id}>
                      <TableCell>{laboratorio.nome}</TableCell>
                      <TableCell>{laboratorio.tipo}</TableCell>
                      <TableCell>{laboratorio.capacidade}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          aria-label={`Editar ${laboratorio.nome}`}
                          title="Editar"
                          onClick={() => abrirEdicao(laboratorio)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          type="button"
                          aria-label={`Remover ${laboratorio.nome}`}
                          title="Remover"
                          onClick={() => void remover(laboratorio)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {laboratorios.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum laboratório cadastrado.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-labelledby="laboratorio-dialog-title">
          <form className="space-y-4" onSubmit={salvar}>
            <h2 id="laboratorio-dialog-title" className="text-lg font-semibold">
              {editingId ? "Editar laboratório" : "Novo laboratório"}
            </h2>
            <div className="space-y-2">
              <label htmlFor="laboratorio-nome" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="laboratorio-nome"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={tipo}
                onValueChange={(value) =>
                  setTipo(value as "redes" | "informatica")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informatica">Informática</SelectItem>
                  <SelectItem value="redes">Redes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="laboratorio-capacidade"
                className="text-sm font-medium"
              >
                Capacidade
              </label>
              <Input
                id="laboratorio-capacidade"
                type="number"
                min="1"
                step="1"
                value={capacidade}
                onChange={(event) => setCapacidade(event.target.value)}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar laboratório"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
