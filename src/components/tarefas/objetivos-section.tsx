"use client";

import { useMemo } from "react";

import type { EquipeTarefaOption } from "@/actions/tarefas/listar-equipes-tarefas";
import { TarefasFilters } from "@/components/tarefas/tarefas-filters";
import {
  calcularResumoObjetivo,
  formatarDataPadrao,
  formatarTipoLabel,
  prazoTimestamp,
} from "@/components/tarefas/tarefas-page.utils";
import type {
  Tarefa,
  TarefasFiltros,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type Props = {
  objetivos: Tarefa[];
  tarefasBase: Tarefa[];
  usuarios: UsuarioResumoTarefa[];
  equipes: EquipeTarefaOption[];
  usuarioAtual: UsuarioResumoTarefa | null;
  filtros: TarefasFiltros;
  onChangeFiltros: (filtros: TarefasFiltros) => void;
  podeCriarObjetivos: boolean;
  podeVerTodasEquipes: boolean;
  onCriarObjetivo: () => void;
  onAbrirObjetivo: (objetivoId: string) => void;
};

function formatarPrioridadeLabel(prioridade: string | null) {
  if (!prioridade) return "Sem prioridade";
  if (prioridade === "media") return "Média";
  return prioridade.charAt(0).toUpperCase() + prioridade.slice(1);
}

function classePrioridadeObjetivo(prioridade: string | null) {
  switch (prioridade) {
    case "urgente":
      return "status-danger";
    case "alta":
      return "status-warning";
    case "media":
      return "status-info";
    case "baixa":
      return "status-neutral";
    default:
      return "status-neutral";
  }
}

function iniciaisNome(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function objetivoEhConcluido(objetivo: Tarefa) {
  return objetivo.status === "concluida";
}

function objetivoLabelEscopo(objetivo: Tarefa) {
  if (objetivo.tipo !== "pai") return null;

  if (objetivo.escopoObjetivo === "global") {
    return {
      titulo: "Objetivo Global",
      classe: "status-info",
    };
  }

  return {
    titulo: objetivo.equipe?.nome
      ? `Objetivo - ${objetivo.equipe.nome}`
      : "Objetivo de Equipe",
    classe: "status-success",
  };
}

function classeStatusObjetivo(status: Tarefa["status"]) {
  switch (status) {
    case "em_atraso":
      return "status-danger";
    case "atencao":
      return "status-warning";
    case "concluida":
      return "status-success";
    case "em_andamento":
      return "status-info";
    case "em_pausa":
      return "status-paused";
    default:
      return "status-neutral";
  }
}

function formatarStatusObjetivo(status: string) {
  return status
    .replaceAll("_", " ")
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

export function ObjetivosSection({
  objetivos,
  tarefasBase,
  usuarios,
  equipes,
  usuarioAtual,
  filtros,
  onChangeFiltros,
  podeCriarObjetivos,
  podeVerTodasEquipes,
  onCriarObjetivo,
  onAbrirObjetivo,
}: Props) {
  const equipesFiltro = useMemo(() => {
    if (podeVerTodasEquipes) {
      return equipes;
    }

    return equipes.filter((equipe) => equipe.id === usuarioAtual?.equipeId);
  }, [equipes, podeVerTodasEquipes, usuarioAtual?.equipeId]);

  const objetivosFiltrados = useMemo(() => {
    let lista = [...objetivos];

    if (filtros.escopoObjetivo === "global") {
      lista = lista.filter((item) => item.escopoObjetivo === "global");
    } else if (
      filtros.escopoObjetivo &&
      filtros.escopoObjetivo !== "todos"
    ) {
      lista = lista.filter(
        (item) =>
          item.escopoObjetivo === "equipe" &&
          item.equipeId === filtros.escopoObjetivo,
      );
    }

    return [...lista].sort((a, b) => {
      const aConcluido = objetivoEhConcluido(a);
      const bConcluido = objetivoEhConcluido(b);

      if (aConcluido && !bConcluido) return 1;
      if (!aConcluido && bConcluido) return -1;

      return (
        prazoTimestamp(a.dataEntrega, a.horaEntrega) -
        prazoTimestamp(b.dataEntrega, b.horaEntrega)
      );
    });
  }, [objetivos, filtros.escopoObjetivo]);

  return (
    <section className="panel-theme rounded-[28px] p-4 backdrop-blur-sm md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-heading-title text-lg font-semibold">
              Objetivos
            </h2>
            <span className="badge-neutral rounded-full px-2.5 py-1 text-[11px]">
              {objetivosFiltrados.length}
            </span>
          </div>

          <p className="section-heading-description mt-1 text-sm">
            Objetivos ficam separados das tarefas operacionais para facilitar o
            acompanhamento estratégico.
          </p>
        </div>

        {podeCriarObjetivos ? (
          <button
            type="button"
            onClick={onCriarObjetivo}
            className="button-primary inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium"
          >
            Adicionar objetivo
          </button>
        ) : null}
      </div>

      <TarefasFilters
        contexto="objetivos"
        filtros={filtros}
        usuarios={usuarios}
        onChange={onChangeFiltros}
        compact
        equipes={equipesFiltro}
        mostrarFiltroEscopoObjetivo={podeVerTodasEquipes}
      />

      <div className="mt-4">
        {objetivosFiltrados.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {objetivosFiltrados.map((objetivo) => {
                const resumo = calcularResumoObjetivo(objetivo.id, tarefasBase);
                const escopo = objetivoLabelEscopo(objetivo);

                return (
                  <button
                    key={objetivo.id}
                    type="button"
                    onClick={() => onAbrirObjetivo(objetivo.id)}
                    className="card-theme interactive-surface group w-[340px] flex-shrink-0 rounded-[24px] p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {podeVerTodasEquipes && escopo ? (
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-medium ${escopo.classe}`}
                          >
                            {escopo.titulo}
                          </span>
                        ) : (
                          <span className="badge-neutral inline-flex rounded-lg px-2.5 py-1 text-[11px] font-medium">
                            {formatarTipoLabel(objetivo.tipo)}
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-medium ${classePrioridadeObjetivo(
                          objetivo.prioridade,
                        )}`}
                      >
                        {formatarPrioridadeLabel(objetivo.prioridade)}
                      </span>
                    </div>

                    <h3 className="mt-4 line-clamp-2 text-[15px] font-semibold leading-6 text-[var(--text-1)]">
                      {objetivo.titulo}
                    </h3>

                    {objetivo.descricao ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--text-3)]">
                        {objetivo.descricao}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-4)]">
                        Sem descrição adicionada.
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div
                        className={`rounded-2xl px-3 py-2.5 ${classeStatusObjetivo(
                          objetivo.status,
                        )}`}
                      >
                        <span className="block text-[10px] uppercase tracking-[0.14em] opacity-80">
                          Status
                        </span>
                        <span className="mt-1 block text-sm font-medium">
                          {formatarStatusObjetivo(objetivo.status)}
                        </span>
                      </div>

                      <div className="surface-3 rounded-2xl px-3 py-2.5">
                        <span className="detail-label block text-[10px] uppercase tracking-[0.14em]">
                          Prazo
                        </span>
                        <span className="detail-value-secondary mt-1 block text-sm">
                          {formatarDataPadrao(objetivo.dataEntrega) ||
                            "Sem prazo"}
                        </span>
                      </div>
                    </div>

                    <div className="surface-3 mt-4 rounded-2xl px-3 py-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="detail-label text-[10px] uppercase tracking-[0.14em]">
                          Progresso
                        </span>
                        <span className="detail-value-secondary text-xs font-medium">
                          {resumo.percentual}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--surface-0)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${resumo.percentual}%`,
                            background:
                              resumo.percentual === 100
                                ? "#22c55e"
                                : resumo.percentual > 0
                                  ? "#22c55e"
                                  : "var(--border)",
                          }}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="badge-neutral rounded-lg px-2.5 py-1 text-[11px] font-medium">
                          {resumo.total} tarefas
                        </span>

                        <span className="badge-neutral rounded-lg px-2.5 py-1 text-[11px] font-medium">
                          {resumo.concluidas} concluídas
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      {objetivo.responsaveis?.length ? (
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {objetivo.responsaveis
                              .slice(0, 4)
                              .map((responsavel) => (
                                <div
                                  key={responsavel.id}
                                  title={responsavel.nome}
                                  className="surface-1 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold"
                                >
                                  {iniciaisNome(responsavel.nome)}
                                </div>
                              ))}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs text-[var(--text-2)]">
                              {objetivo.responsaveis[0]?.nome}
                              {objetivo.responsaveis.length > 1
                                ? ` +${objetivo.responsaveis.length - 1}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-3)]">
                          Sem responsáveis
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="surface-0 rounded-2xl p-5 text-sm text-[var(--text-3)]">
            Nenhum objetivo encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </section>
  );
}