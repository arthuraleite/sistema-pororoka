"use client";

import Image from "next/image";
import { useMemo } from "react";

import { NAVEGACAO_PRINCIPAL } from "@/constants/rotas";
import { NavLinkItem } from "@/components/layout/nav-link-item";

type PropriedadesSidebar = {
  perfilUsuario?: string | null;
  equipeNome?: string | null;
  expandida?: boolean;
  sempreExpandida?: boolean;
  onExpandir?: () => void;
  onRecolher?: () => void;
};

export function Sidebar({
  perfilUsuario,
  equipeNome,
  expandida = false,
  sempreExpandida = false,
  onExpandir,
  onRecolher,
}: PropriedadesSidebar) {
  const itensVisiveis = useMemo(() => {
    return NAVEGACAO_PRINCIPAL.filter((item) =>
      item.podeExibir({ perfilUsuario, equipeNome }),
    );
  }, [perfilUsuario, equipeNome]);

  return (
    <aside
      className="sidebar-theme sidebar-shell hidden shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:block"
      data-sidebar-state={expandida ? "expanded" : "collapsed"}
      onMouseEnter={onExpandir}
      onMouseLeave={onRecolher}
    >
      <div className="flex h-screen flex-col">
        <div className="sidebar-section-divider px-3 py-5">
          <div className="flex items-center justify-center">
            {expandida ? (
              <div className="relative h-12 w-28 overflow-hidden">
                <Image
                  src="/logo-prrk-branca.png"
                  alt="Pororoka"
                  fill
                  priority
                  className="object-contain object-left"
                />
              </div>
            ) : (
              <div className="sidebar-brand-mini">
                <span>P</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {itensVisiveis.map((item) => (
            <NavLinkItem
              key={item.key}
              href={item.href}
              label={item.label}
              icon={item.icon}
              recolhido={!expandida}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}