import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getStatusColor(status: string) {
  switch (status) {
    case "pendente":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "aprovado":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "recusado":
      return "bg-red-100 text-red-800 border-red-200";
    case "cancelado":
      return "bg-slate-200 text-slate-800 border-slate-300";
    case "aguardando_confirmacao_cancelamento":
      return "bg-violet-100 text-violet-800 border-violet-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}
