import Image from "next/image";
import { NAVEGACAO_PRINCIPAL } from "@/constants/rotas";
import { NavLinkItem } from "@/components/layout/nav-link-item";

export function Sidebar() {
  return (
    <aside className="sidebar-theme sidebar-structure hidden shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:block">
      <div className="flex h-screen flex-col">
        <div className="sidebar-section-divider px-5 py-6">
          <div className="flex items-center">
            <div className="relative h-12 w-28 overflow-hidden">
              <Image
                src="/logo-prrk-branca.png"
                alt="Pororoka"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAVEGACAO_PRINCIPAL.map((item) => (
            <NavLinkItem key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </div>
    </aside>
  );
}