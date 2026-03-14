"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type PropriedadesNavLinkItem = {
  href: string;
  label: string;
};

export function NavLinkItem({
  href,
  label,
}: PropriedadesNavLinkItem) {
  const pathname = usePathname();
  const ativo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        "block rounded-lg px-3 py-2 text-sm font-medium",
        ativo ? "nav-link-active" : "nav-link",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}