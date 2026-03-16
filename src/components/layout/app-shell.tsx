"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/layout/barra-lateral";
import { HeaderInterno } from "@/components/layout/header-interno";
import { GuardiaSessaoAtiva } from "@/components/auth/guardia-sessao-ativa";
import { ROTAS_APP } from "@/constants/rotas";

type PropriedadesAppShell = {
  children: ReactNode;
  nomeUsuario?: string | null;
  emailUsuario?: string | null;
  avatarUrl?: string | null;
  perfilUsuario?: string | null;
  equipeNome?: string | null;
};

export function AppShell({
  children,
  nomeUsuario,
  emailUsuario,
  avatarUrl,
  perfilUsuario,
  equipeNome,
}: PropriedadesAppShell) {
  const pathname = usePathname();
  const [hoverPathname, setHoverPathname] = useState<string | null>(null);

  const sidebarSempreExpandida = useMemo(() => {
    return (
      pathname === ROTAS_APP.dashboard ||
      pathname.startsWith(`${ROTAS_APP.dashboard}/`)
    );
  }, [pathname]);

  const hoverAtivoNaRotaAtual = hoverPathname === pathname;
  const sidebarExpandida = sidebarSempreExpandida || hoverAtivoNaRotaAtual;

  return (
    <div className="bg-theme-background text-theme-1 min-h-screen">
      <GuardiaSessaoAtiva />

      <div className="flex min-h-screen">
        <Sidebar
          perfilUsuario={perfilUsuario}
          equipeNome={equipeNome}
          expandida={sidebarExpandida}
          sempreExpandida={sidebarSempreExpandida}
          onExpandir={() => {
            if (!sidebarSempreExpandida) {
              setHoverPathname(pathname);
            }
          }}
          onRecolher={() => {
            if (!sidebarSempreExpandida) {
              setHoverPathname(null);
            }
          }}
        />

        <div
          className="layout-with-sidebar flex min-w-0 flex-1 flex-col"
          data-sidebar-layout={sidebarExpandida ? "expanded" : "collapsed"}
        >
          <HeaderInterno
            nomeUsuario={nomeUsuario}
            emailUsuario={emailUsuario}
            avatarUrl={avatarUrl}
          />

          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-none px-4 py-6 sm:px-5 lg:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}