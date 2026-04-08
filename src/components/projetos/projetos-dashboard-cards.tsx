"use client";

import type { ProjetosDashboardResumo } from "@/types/projetos/projetos.types";

type Props = {
  resumo: ProjetosDashboardResumo;
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(valor);
}

function CardResumo({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: string;
  descricao: string;
}) {
  return (
    <article
      className="card-theme rounded-[var(--radius-2xl)] p-5"
      style={{ minHeight: 148 }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--text-3)" }}>
        {titulo}
      </p>
      <p
        className="mt-3 text-2xl font-semibold sm:text-3xl"
        style={{ color: "var(--text-1)" }}
      >
        {valor}
      </p>
      <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-4)" }}>
        {descricao}
      </p>
    </article>
  );
}

export function ProjetosDashboardCards({ resumo }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardResumo
        titulo="Projetos"
        valor={String(resumo.total_projetos)}
        descricao="Quantidade total de projetos visíveis para o usuário atual."
      />

      <CardResumo
        titulo="Orçamento total"
        valor={formatarMoeda(resumo.valor_total_orcamento)}
        descricao="Soma do orçamento total dos projetos visíveis nesta fase do módulo."
      />

      <CardResumo
        titulo="Concluídos"
        valor={String(resumo.projetos_concluidos)}
        descricao="Projetos com status concluído."
      />

      <CardResumo
        titulo="Em execução"
        valor={String(resumo.projetos_em_execucao)}
        descricao="Projetos com status em andamento."
      />
    </section>
  );
}