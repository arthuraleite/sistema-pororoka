"use client";

import { useRef } from "react";
import { TarefaCard } from "@/components/tarefas/tarefa-card";
import type { TarefaKanbanCard } from "@/types/tarefas/tarefas.types";

type Props = {
  cards: TarefaKanbanCard[];
  ordenacao?: "alfabetica" | "prioridade" | "status" | "data_entrega";
  onOpenTask?: (taskId: string) => void;
  showEquipeBadge?: boolean;
  hideTipoBadge?: boolean;
  onMoveTask?: (
    cardId: string,
    novoStatus: TarefaKanbanCard["status"],
  ) => void | Promise<void>;
};

const colunas = [
  { status: "a_fazer", titulo: "A Fazer" },
  { status: "em_andamento", titulo: "Em Andamento" },
  { status: "atencao", titulo: "Atenção" },
  { status: "em_pausa", titulo: "Em Pausa" },
  { status: "em_atraso", titulo: "Em Atraso" },
  { status: "concluida", titulo: "Concluída" },
] as const;

function classeCabecalhoColuna(status: TarefaKanbanCard["status"]) {
  switch (status) {
    case "em_andamento":
      return "kanban-header-info";
    case "atencao":
      return "kanban-header-warning";
    case "em_pausa":
      return "kanban-header-paused";
    case "em_atraso":
      return "kanban-header-danger";
    case "concluida":
      return "kanban-header-success";
    case "a_fazer":
    default:
      return "kanban-header-neutral";
  }
}

function ordenarCardsColuna(
  cards: TarefaKanbanCard[],
  ordenacao: "alfabetica" | "prioridade" | "status" | "data_entrega",
) {
  const prioridadePeso = (prioridade: TarefaKanbanCard["prioridade"]) => {
    switch (prioridade) {
      case "urgente":
        return 0;
      case "alta":
        return 1;
      case "media":
        return 2;
      case "baixa":
        return 3;
      default:
        return 4;
    }
  };

  const prazoTimestamp = (prazo: string, horaEntrega?: string | null) => {
    return new Date(
      horaEntrega ? `${prazo}T${horaEntrega}:00` : `${prazo}T23:59:59`,
    ).getTime();
  };

  return [...cards].sort((a, b) => {
    if (a.emAtraso && !b.emAtraso) return -1;
    if (!a.emAtraso && b.emAtraso) return 1;

    switch (ordenacao) {
      case "alfabetica":
        return a.titulo.localeCompare(b.titulo);

      case "prioridade": {
        const prioridade =
          prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
        if (prioridade !== 0) return prioridade;
        return prazoTimestamp(a.prazo, a.horaEntrega) - prazoTimestamp(b.prazo, b.horaEntrega);
      }

      case "status":
        return a.status.localeCompare(b.status);

      case "data_entrega":
      default: {
        const prazo =
          prazoTimestamp(a.prazo, a.horaEntrega) -
          prazoTimestamp(b.prazo, b.horaEntrega);
        if (prazo !== 0) return prazo;

        const prioridade =
          prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
        if (prioridade !== 0) return prioridade;

        return a.titulo.localeCompare(b.titulo);
      }
    }
  });
}

export function TarefasKanban({
  cards,
  ordenacao = "data_entrega",
  onOpenTask,
  hideTipoBadge = false,
  showEquipeBadge = false,
  onMoveTask,
}: Props) {
  const scrollRef = useRef<HTMLElement | null>(null);
  return (
    <section
      ref={scrollRef}
      className="overflow-x-auto"
      onDragOver={(event) => {
        const container = scrollRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const threshold = 80;
        const scrollStep = 24;

        if (event.clientX < rect.left + threshold) {
          container.scrollLeft -= scrollStep;
        } else if (event.clientX > rect.right - threshold) {
          container.scrollLeft += scrollStep;
        }
      }}
    >
      <div className="grid min-w-[1860px] grid-cols-6 gap-4">
        {colunas.map((coluna) => {
          const cardsColuna = ordenarCardsColuna(
            cards.filter((card) => card.status === coluna.status),
            ordenacao,
          );

          return (
            <div
              key={coluna.status}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={async (event) => {
                event.preventDefault();

                const cardId = event.dataTransfer.getData("text/plain");
                if (!cardId || !onMoveTask) return;

                await onMoveTask(cardId, coluna.status);
              }}
              className="surface-1 flex h-[calc(100vh-260px)] min-h-[520px] flex-col rounded-3xl px-5 pb-5 pt-4">
                <div className="mb-4 -mx-5 -mt-4">
                  <div
                    className={[
                      "flex min-h-[35px] w-full items-center justify-between rounded-t-3xl px-5 py-4",
                      classeCabecalhoColuna(coluna.status),
                    ].join(" ")}
                  >
                    <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
                      {coluna.titulo}
                    </h2>

                    <span className="kanban-header-count inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold">
                      {cardsColuna.length}
                    </span>
                  </div>
                </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {cardsColuna.length === 0 ? (
                  <div className="surface-0 rounded-2xl p-4 text-sm text-[var(--text-3)]">
                    Nenhuma tarefa nesta coluna.
                  </div>
                ) : null}

                {cardsColuna.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", card.id);
                    }}
                  >
                    <TarefaCard
                      titulo={card.titulo}
                      tipo={card.tipo}
                      status={card.status}
                      prioridade={card.prioridade}
                      prazo={card.prazo}
                      horaEntrega={card.horaEntrega}
                      categoria={card.categoria ?? null}
                      equipe={card.equipe ?? null}
                      objetivoTitulo={card.objetivoTitulo ?? null}
                      responsaveis={card.responsaveis ?? []}
                      emAtraso={card.emAtraso}
                      showStatus={false}
                      hideTipoBadge={hideTipoBadge}
                      showEquipeBadge={showEquipeBadge}
                      onClick={
                        onOpenTask ? () => onOpenTask(card.id) : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}