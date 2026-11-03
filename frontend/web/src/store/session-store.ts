import { create } from "zustand";
import type { SessaoUsuario, TipoUsuario, Usuario } from "@/lib/types";

interface SessionState {
  session: SessaoUsuario | null;
  setSession: (usuario: Usuario) => void;
  clearSession: () => void;
  role: TipoUsuario | null;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  role: null,
  setSession: (usuario) =>
    set({
      session: { usuario, role: usuario.tipo },
      role: usuario.tipo,
    }),
  clearSession: () => set({ session: null, role: null }),
}));
