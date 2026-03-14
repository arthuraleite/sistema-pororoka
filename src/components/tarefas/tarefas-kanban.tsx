"use client";

import { TarefaCard } from "@/components/tarefas/tarefa-card";
import type { TarefaKanbanCard } from "@/types/tarefas/tarefas.types";

type Props = {
  cards: TarefaKanbanCard[];
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
    case "a_fazer":
      return "border-slate-800 bg-slate-950/40 text-slate-200";
    case "em_andamento":
      return "border-sky-800 bg-sky-950/40 text-sky-200";
    case "atencao":
      return "border-amber-800 bg-amber-950/40 text-amber-200";
    case "em_pausa":
      return "border-violet-800 bg-violet-950/40 text-violet-200";
    case "em_atraso":
      return "border-red-800 bg-red-950/40 text-red-200";
    case "concluida":
      return "border-emerald-800 bg-emerald-950/40 text-emerald-200";
    default:
      return "border-zinc-800 bg-zinc-950 text-zinc-200";
  }
}

export function TarefasKanban({
  cards,
  onOpenTask,
  hideTipoBadge = false,
  showEquipeBadge = false,
  onMoveTask,
}: Props) {
  return (
    <section className="overflow-x-auto">
      <div className="grid min-w-[1650px] grid-cols-6 gap-4">
        {colunas.map((coluna) => {
          const cardsColuna = cards.filter((card) => card.status === coluna.status);

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
              className="rounded-3xl p-4"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-1)",
              }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div
                  className={[
                    "inline-flex items-center rounded-xl border px-3 py-2",
                    classeCabecalhoColuna(coluna.status),
                  ].join(" ")}
                >
                  <h2 className="text-sm font-semibold uppercase tracking-wide">
                    {coluna.titulo}
                  </h2>
                </div>

                <span
                  className="rounded-full px-2.5 py-1 text-xs"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface-0)",
                    color: "var(--text-3)",
                  }}
                >
                  {cardsColuna.length}
                </span>
              </div>

              <div className="space-y-3">
                {cardsColuna.length === 0 ? (
                  <div
                    className="rounded-2xl p-4 text-sm"
                    style={{
                      border: "1px dashed var(--border)",
                      backgroundColor: "var(--surface-0)",
                      color: "var(--text-3)",
                    }}
                  >
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