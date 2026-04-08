"use client";

import type { ProjetoListItem } from "@/types/projetos/projetos.types";

type Props = {
  projetos: ProjetoListItem[];
};

function formatarMoeda(valor: number | null) {
  if (valor === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatarTipo(tipo: ProjetoListItem["tipo"]) {
  return tipo === "financiado" ? "Financiado" : "Interno";
}

function formatarStatus(status: ProjetoListItem["status"]) {
  switch (status) {
    case "a_iniciar":
      return "A iniciar";
    case "em_andamento":
      return "Em andamento";
    case "finalizado":
      return "Finalizado";
    case "concluido":
      return "Concluído";
    default:
      return status;
  }
}

function classeStatus(status: ProjetoListItem["status"]) {
  switch (status) {
    case "concluido":
      return "status-success";
    case "em_andamento":
      return "status-info";
    case "finalizado":
      return "status-warning";
    case "a_iniciar":
    default:
      return "status-neutral";
  }
}

export function ProjetosLista({ projetos }: Props) {
  if (projetos.length === 0) {
    return (
      <section
        className="rounded-[var(--radius-2xl)] p-6"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="rounded-[var(--radius-2xl)] border border-dashed p-6 text-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-0)",
            color: "var(--text-4)",
          }}
        >
          Nenhum projeto encontrado com os filtros atuais.
        </div>
      </section>
    );
  }

  return (
    <section className="table-theme overflow-hidden rounded-[var(--radius-2xl)] border border-theme bg-theme-card">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr
              style={{
                backgroundColor: "var(--surface-1)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Projeto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Coordenador
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Financiador
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Início
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Orçamento
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                Objetivos
              </th>
            </tr>
          </thead>

          <tbody>
            {projetos.map((projeto) => (
              <tr
                key={projeto.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <td className="px-4 py-4 align-top">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      {projeto.nome}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>
                      {projeto.sigla}
                    </p>
                    {projeto.resumo ? (
                      <p
                        className="max-w-[420px] text-sm leading-6"
                        style={{ color: "var(--text-3)" }}
                      >
                        {projeto.resumo}
                      </p>
                    ) : null}
                  </div>
                </td>

                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-2)" }}>
                  {formatarTipo(projeto.tipo)}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`${classeStatus(projeto.status)} inline-flex rounded-full px-3 py-1 text-xs font-medium`}
                  >
                    {formatarStatus(projeto.status)}
                  </span>
                </td>

                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto.coordenador_nome ?? "—"}
                </td>

                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto.financiador_nome ?? "—"}
                </td>

                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-2)" }}>
                  {new Intl.DateTimeFormat("pt-BR").format(
                    new Date(`${projeto.data_inicio}T00:00:00`),
                  )}
                </td>

                <td
                  className="px-4 py-4 text-right text-sm font-medium"
                  style={{ color: "var(--text-2)" }}
                >
                  {formatarMoeda(projeto.orcamento_total)}
                </td>

                <td
                  className="px-4 py-4 text-right text-sm"
                  style={{ color: "var(--text-2)" }}
                >
                  {projeto.total_objetivos_concluidos}/{projeto.total_objetivos}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}