"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type PropriedadesNavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  recolhido?: boolean;
};

export function NavLinkItem({
  href,
  label,
  icon: Icone,
  recolhido = false,
}: PropriedadesNavLinkItem) {
  const pathname = usePathname();
  const ativo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        "sidebar-nav-link rounded-xl text-sm font-medium",
        ativo ? "nav-link-active" : "nav-link",
        recolhido ? "justify-center px-0" : "gap-3 px-3",
      ].join(" ")}
      title={recolhido ? label : undefined}
      aria-label={label}
    >
      <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!recolhido ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}