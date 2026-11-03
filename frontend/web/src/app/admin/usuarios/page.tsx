"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";

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
import { fetchUsuarios, updateUsuarioRole } from "@/lib/services";
import type { Usuario } from "@/lib/types";
import { deleteUsuario } from "@/lib/services";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState<Usuario | null>(null);

  useEffect(() => {
    let active = true;

    try {
      const storedUser = localStorage.getItem("lab_user");
      if (storedUser)
        setCurrentUserId((JSON.parse(storedUser) as { id?: string }).id ?? "");
    } catch {
      setCurrentUserId("");
    }

    fetchUsuarios()
      .then((data) => {
        if (active) setUsuarios(data);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar os usuários.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return usuarios;
    return usuarios.filter((usuario) =>
      [usuario.nome, usuario.email, usuario.tipo].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(query),
      ),
    );
  }, [search, usuarios]);

  const alterarPapel = async (usuario: Usuario, role: Usuario["tipo"]) => {
    if (usuario.tipo === role) return;
    if (
      role === "admin" &&
      !window.confirm(`Promover ${usuario.nome} para administrador?`)
    )
      return;
    setActionId(usuario.id);
    setError("");

    try {
      const updated = await updateUsuarioRole(usuario.id, role);
      setUsuarios((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível promover o usuário.",
      );
    } finally {
      setActionId(null);
    }
  };

  const excluirUsuario = async () => {
    if (!pendingDeletion) return;
    const usuario = pendingDeletion;
    setActionId(usuario.id);
    setError("");

    try {
      await deleteUsuario(usuario.id);
      setUsuarios((items) => items.filter((item) => item.id !== usuario.id));
      setPendingDeletion(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir o usuário.",
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <AppShell role="admin" title="Usuários">
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle>Gestão de usuários</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar usuário"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando usuários...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell>{usuario.tipo}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={usuario.tipo}
                          disabled={actionId !== null}
                          onValueChange={(value) =>
                            void alterarPapel(usuario, value as Usuario["tipo"])
                          }
                        >
                          <SelectTrigger
                            aria-label={`Papel de ${usuario.nome}`}
                            className="w-40"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aluno">Aluno</SelectItem>
                            <SelectItem value="professor">Professor</SelectItem>
                            <SelectItem value="funcionario">
                              Funcionário
                            </SelectItem>
                            <SelectItem value="monitor">Monitor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="danger"
                          size="icon"
                          title={
                            usuario.id === currentUserId
                              ? "Não é possível excluir sua própria conta"
                              : `Excluir ${usuario.nome}`
                          }
                          aria-label={`Excluir ${usuario.nome}`}
                          disabled={
                            usuario.id === currentUserId || actionId !== null
                          }
                          onClick={() => setPendingDeletion(usuario)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filteredUsers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open && actionId === null) setPendingDeletion(null);
        }}
      >
        <DialogContent aria-labelledby="delete-user-title">
          {pendingDeletion && (
            <div className="space-y-4">
              <div>
                <h2 id="delete-user-title" className="text-lg font-semibold">
                  Confirmar exclusão
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tem certeza de que deseja excluir{" "}
                  <strong>{pendingDeletion.nome}</strong> (
                  {pendingDeletion.email})? A conta e os agendamentos associados
                  serão removidos. Esta ação não pode ser desfeita.
                </p>
              </div>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={actionId !== null}
                  onClick={() => setPendingDeletion(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={actionId !== null}
                  onClick={() => void excluirUsuario()}
                >
                  {actionId === pendingDeletion.id
                    ? "Excluindo..."
                    : "Sim, excluir usuário"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
