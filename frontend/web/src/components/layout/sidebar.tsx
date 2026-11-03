import Link from "next/link";
import {
  BarChart3,
  CalendarCheck2,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Bell,
  MonitorCog,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = {
  aluno: [
    { href: "/aluno/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/aluno/agendar-computador",
      label: "Agendar computador",
      icon: Cpu,
    },
    {
      href: "/aluno/minhas-solicitacoes",
      label: "Minhas solicitações",
      icon: ClipboardList,
    },
  ],
  professor: [
    { href: "/professor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/professor/agendar-laboratorio",
      label: "Agendar laboratório",
      icon: CalendarCheck2,
    },
    {
      href: "/professor/minhas-solicitacoes",
      label: "Minhas solicitações",
      icon: ClipboardList,
    },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/aprovacoes", label: "Aprovações", icon: ShieldCheck },
    { href: "/admin/calendario", label: "Calendário", icon: CalendarCheck2 },
    { href: "/admin/laboratorios", label: "Laboratórios", icon: MonitorCog },
    { href: "/admin/usuarios", label: "Usuários", icon: Users },
    { href: "/admin/admins", label: "Administradores", icon: ShieldCheck },
  ],
  monitor: [
    {
      href: "/monitor/aprovacoes-extras",
      label: "Aprovações extras",
      icon: Bell,
    },
  ],
};

export function Sidebar({
  role,
  mobileOpen = false,
  onNavigate,
}: {
  role: "aluno" | "professor" | "admin" | "monitor";
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const items = navItems[role];

  return (
    <aside
      className={cn(
        "w-72 shrink-0 border-r border-border bg-[linear-gradient(180deg,rgba(10,20,39,0.96),rgba(18,32,54,0.92))] text-white",
        mobileOpen
          ? "fixed inset-y-0 left-0 z-50 block overflow-y-auto"
          : "hidden lg:block",
      )}
    >
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-lg font-bold text-blue-200 ring-1 ring-white/10">
            FAP
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-blue-200/80">
              Sistema
            </p>
            <div className="text-sm font-semibold text-white">
              LABORATÓRIO FAP
            </div>
          </div>
        </div>
      </div>
      <nav className="space-y-2 p-4">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 text-blue-200" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 border-t border-white/10 p-4 text-xs text-slate-300">
        Monitoramento em tempo real
      </div>
    </aside>
  );
}
