import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/barra-lateral";
import { HeaderInterno } from "@/components/layout/header-interno";
import { GuardiaSessaoAtiva } from "@/components/auth/guardia-sessao-ativa";

type PropriedadesAppShell = {
  children: ReactNode;
  nomeUsuario?: string | null;
  emailUsuario?: string | null;
  avatarUrl?: string | null;
};

export function AppShell({
  children,
  nomeUsuario,
  emailUsuario,
  avatarUrl,
}: PropriedadesAppShell) {
  return (
    <div className="bg-theme-background text-theme-1 min-h-screen">
      <GuardiaSessaoAtiva />

      <div className="flex min-h-screen">
        <Sidebar />

        <div className="layout-with-sidebar flex min-w-0 flex-1 flex-col">
          <HeaderInterno
            nomeUsuario={nomeUsuario}
            emailUsuario={emailUsuario}
            avatarUrl={avatarUrl}
          />

          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}