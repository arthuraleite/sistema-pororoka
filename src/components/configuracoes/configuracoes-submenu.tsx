"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROTAS_APP } from "@/constants/rotas";

const itens = [
  {
    label: "Usuários",
    href: ROTAS_APP.configuracoesUsuarios,
  },
  {
    label: "Equipes",
    href: ROTAS_APP.configuracoesEquipes,
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ConfiguracoesSubmenu() {
  const pathname = usePathname();

  return (
    <div className="surface-1 rounded-[var(--radius-2xl)] p-2">
      <nav className="flex flex-col gap-2 md:flex-row">
        {itens.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                active
                  ? "interactive-surface-active"
                  : "interactive-surface text-theme-3 border-transparent",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}