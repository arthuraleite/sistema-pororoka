import { ConfiguracoesSubmenu } from "@/components/configuracoes/configuracoes-submenu";

type ConfiguracoesHomeProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function ConfiguracoesHome({
  title,
  description,
  children,
}: ConfiguracoesHomeProps) {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-theme-4 text-xs font-semibold uppercase tracking-[0.18em]">
          Configurações
        </p>

        <div className="mt-2">
          <h1 className="text-theme-1 text-2xl font-semibold">{title}</h1>
          <p className="text-theme-3 mt-1 text-sm">{description}</p>
        </div>
      </header>

      <ConfiguracoesSubmenu />

      <div className="card-theme rounded-[var(--radius-2xl)] p-5">
        {children}
      </div>
    </section>
  );
}