"use client";

import { useEffect, useState } from "react";
import { ShieldPlus, Trash2 } from "lucide-react";

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
  deleteUsuario,
  fetchUsuarios,
  updateUsuarioRole,
} from "@/lib/services";
import type { Usuario } from "@/lib/types";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchUsuarios()
      .then((data) => {
        if (active)
          setAdmins(data.filter((usuario) => usuario.tipo === "admin"));
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar os administradores.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const adicionar = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Informe o e-mail de uma conta já cadastrada.");
      return;
    }

    setActionPending(true);
    setError("");
    try {
      const usuarios = await fetchUsuarios();
      const usuario = usuarios.find(
        (item) => item.email.toLowerCase() === normalizedEmail,
      );
      if (!usuario) {
        setError("Não há usuário cadastrado com esse e-mail.");
        return;
      }
      if (usuario.tipo === "admin") {
        setError("Esse usuário já é administrador.");
        return;
      }

      const updated = await updateUsuarioRole(usuario.id, "admin");
      setAdmins((items) =>
        [...items, updated].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setEmail("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível adicionar o administrador.",
      );
    } finally {
      setActionPending(false);
    }
  };

  const remover = async (admin: Usuario) => {
    if (!window.confirm(`Remover a conta de ${admin.nome}?`)) return;
    setActionPending(true);
    setError("");
    try {
      await deleteUsuario(admin.id);
      setAdmins((items) => items.filter((item) => item.id !== admin.id));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível remover o administrador.",
      );
    } finally {
      setActionPending(false);
    }
  };

  return (
    <AppShell role="admin" title="Administradores">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Lista de administradores</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="E-mail de usuário cadastrado"
              className="w-52"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              type="button"
              disabled={actionPending}
              onClick={() => void adicionar()}
            >
              <ShieldPlus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
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
              Carregando administradores...
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.nome}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Button
                          variant="danger"
                          size="sm"
                          type="button"
                          disabled={actionPending}
                          onClick={() => void remover(admin)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {admins.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum administrador cadastrado.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
