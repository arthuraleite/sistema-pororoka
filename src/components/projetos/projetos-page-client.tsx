"use client";

import { useMemo, useState } from "react";

import { ProjetosDashboardCards } from "@/components/projetos/projetos-dashboard-cards";
import { ProjetosFilters } from "@/components/projetos/projetos-filters";
import { ProjetosLista } from "@/components/projetos/projetos-lista";
import type {
  ProjetoListItem,
  ProjetosDashboardResumo,
  ProjetosFiltros,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

type Props = {
  resultadoProjetos: ResultadoOperacaoProjeto<ProjetoListItem[]>;
  resultadoDashboard: ResultadoOperacaoProjeto<ProjetosDashboardResumo>;
};

export function ProjetosPageClient({
  resultadoProjetos,
  resultadoDashboard,
}: Props) {
  const [filtros, setFiltros] = useState<ProjetosFiltros>({
    ordenacao: "data_inicio",
  });

  const erroInicial =
    (!resultadoProjetos.sucesso && resultadoProjetos.mensagem) ||
    (!resultadoDashboard.sucesso && resultadoDashboard.mensagem) ||
    null;

  const projetosBase = useMemo(
    () => resultadoProjetos.data ?? [],
    [resultadoProjetos.data],
  );

  const dashboard = resultadoDashboard.data ?? {
    total_projetos: 0,
    valor_total_orcamento: 0,
    projetos_concluidos: 0,
    projetos_em_execucao: 0,
  };

  const projetosFiltrados = useMemo(() => {
    const busca = filtros.busca?.trim().toLowerCase() ?? "";
    const tipos = filtros.tipo ?? [];
    const status = filtros.status ?? [];
    const ordenacao = filtros.ordenacao ?? "data_inicio";

    const filtrados = projetosBase.filter((item) => {
      if (busca) {
        const alvo = [
          item.nome,
          item.sigla,
          item.resumo ?? "",
          item.coordenador_nome ?? "",
          item.financiador_nome ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!alvo.includes(busca)) return false;
      }

      if (tipos.length > 0 && !tipos.includes(item.tipo)) return false;
      if (status.length > 0 && !status.includes(item.status)) return false;

      return true;
    });

    return [...filtrados].sort((a, b) => {
      switch (ordenacao) {
        case "nome":
          return a.nome.localeCompare(b.nome);
        case "orcamento_total":
          return (b.orcamento_total ?? 0) - (a.orcamento_total ?? 0);
        case "status":
          return a.status.localeCompare(b.status);
        case "data_inicio":
        default:
          return (
            new Date(b.data_inicio).getTime() -
            new Date(a.data_inicio).getTime()
          );
      }
    });
  }, [projetosBase, filtros]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading-title text-2xl font-semibold md:text-3xl">
              Projetos
            </h1>
            <p
              className="section-heading-description mt-2 max-w-3xl text-sm leading-6 md:text-base"
            >
              Acompanhe a base de projetos da organização, com visão de status,
              orçamento, coordenação e objetivos vinculados nesta fase inicial do módulo.
            </p>
          </div>

          <div
            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
          >
            {projetosFiltrados.length} projeto(s)
          </div>
        </div>
      </section>

      {erroInicial ? (
        <div
          className="rounded-[var(--radius-2xl)] p-4 text-sm"
          style={{
            border: "1px solid #6b2328",
            backgroundColor: "#2a1316",
            color: "#fecaca",
          }}
        >
          {erroInicial}
        </div>
      ) : null}

      <ProjetosDashboardCards resumo={dashboard} />
      <ProjetosFilters filtros={filtros} onChange={setFiltros} />
      <ProjetosLista projetos={projetosFiltrados} />
    </div>
  );
}