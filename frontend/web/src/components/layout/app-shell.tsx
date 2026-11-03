"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AppShell({
  role,
  children,
  title,
}: {
  role: "aluno" | "professor" | "admin" | "monitor";
  children: React.ReactNode;
  title: string;
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notificationHref =
    role === "admin"
      ? "/admin/aprovacoes"
      : role === "monitor"
        ? "/monitor/aprovacoes-extras"
        : `/${role}/minhas-solicitacoes`;

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        role={role}
        mobileOpen={mobileMenuOpen}
        onNavigate={() => setMobileMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between border-b border-border bg-card/75 px-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)] backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Sistema
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 md:flex dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Operação em tempo real
            </div>
            <Link
              href={notificationHref}
              className="relative rounded-full border border-border bg-background p-2.5 text-foreground shadow-sm transition hover:bg-muted"
              aria-label="Notificações"
              title={
                role === "admin" || role === "monitor"
                  ? "Abrir aprovações"
                  : "Abrir minhas solicitações"
              }
            >
              <Bell className="h-4 w-4" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              aria-label={
                theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Sair <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className={cn("flex-1 p-4 lg:p-6")}>{children}</main>
      </div>
    </div>
  );
}
