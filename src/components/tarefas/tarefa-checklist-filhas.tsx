"use client";

import type { TarefaChecklistItem } from "@/types/tarefas/tarefas.types";
import type { TarefaFilhaDraft } from "@/components/tarefas/hooks/use-tarefa-pai-draft";

type ItemLista =
  | (TarefaChecklistItem & { origem?: "persistida" })
  | (TarefaFilhaDraft & { origem: "draft"; id: string });

type Props = {
  titulo?: string;
  itens: ItemLista[];
  emptyLabel?: string;
  onAdicionar?: () => void;
  onRemoverDraft?: (idLocal: string) => void;
};

function formatarStatus(status: string) {
  return status
    .split("_")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function formatarPrazo(dataEntrega: string, horaEntrega?: string | null) {
  if (!dataEntrega) return "Prazo não definido";
  const data = new Date(`${dataEntrega}T${horaEntrega || "00:00"}:00`);
  if (Number.isNaN(data.getTime())) return dataEntrega;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: horaEntrega ? "short" : undefined,
  }).format(data);
}

function statusClasse(status: string) {
  switch (status) {
    case "em_atraso":
      return "status-danger";
    case "concluida":
      return "status-success";
    case "atencao":
      return "status-warning";
    case "em_andamento":
      return "status-info";
    default:
      return "status-neutral";
  }
}

export function TarefaChecklistFilhas({
  titulo = "Tarefas de objetivo",
  itens,
  emptyLabel = "Nenhuma tarefa adicionada a este objetivo...",
  onAdicionar,
  onRemoverDraft,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-1)]">{titulo}</h3>
          <p className="mt-1 text-xs text-[var(--text-4)]">
            Subtarefas vinculadas ao objetivo, persistidas ou ainda em rascunho.
          </p>
        </div>

        {onAdicionar ? (
          <button
            type="button"
            onClick={onAdicionar}
            className="button-neutral inline-flex rounded-xl px-3 py-2 text-sm"
          >
            + Adicionar
          </button>
        ) : null}
      </div>

      {itens.length === 0 ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            border: "1px dashed var(--border)",
            backgroundColor: "var(--surface-0)",
            color: "var(--text-3)",
          }}
        >
          {emptyLabel}
        </div>
      ) : null}

      <div className="space-y-3">
        {itens.map((item) => {
          const id = "idLocal" in item ? item.idLocal : item.id;
          const origemDraft = "origem" in item && item.origem === "draft";
          return (
            <article
              key={id}
              className="rounded-2xl p-4"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-0)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-medium text-[var(--text-1)]">{item.titulo}</h4>
                  <p className="mt-2 text-xs text-[var(--text-4)]">
                    Prazo: {formatarPrazo(item.dataEntrega, item.horaEntrega)}
                  </p>
                </div>

                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClasse(item.status)}`}>
                  {formatarStatus(item.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-4)]">
                {item.prioridade ? (
                  <span className="badge-neutral rounded-full px-2 py-1">
                    {item.prioridade}
                  </span>
                ) : null}
                {origemDraft ? (
                  <span className="badge-neutral rounded-full px-2 py-1">Rascunho</span>
                ) : null}
              </div>

              {origemDraft && onRemoverDraft ? (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onRemoverDraft(item.idLocal)}
                    className="button-neutral rounded-xl px-3 py-2 text-xs"
                  >
                    Remover rascunho
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
