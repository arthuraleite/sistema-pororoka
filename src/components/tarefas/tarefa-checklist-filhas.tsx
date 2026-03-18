"use client";

import Image from "next/image";

import type { TarefaChecklistItem } from "@/types/tarefas/tarefas.types";
import type { TarefaFilhaDraft } from "@/components/tarefas/hooks/use-tarefa-pai-draft";

export type ItemLista =
  | (TarefaChecklistItem & { origem: "persistida" })
  | (TarefaFilhaDraft & { origem: "draft"; id: string });

type Props = {
  titulo?: string;
  itens: ItemLista[];
  emptyLabel?: string;
  onAdicionar?: () => void;
  onAbrirItem?: (item: ItemLista) => void;
  onRemoverDraft?: (idLocal: string) => void;
};

function formatarStatus(status: string) {
  return status
    .split("_")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function formatarPrioridade(prioridade?: string | null) {
  if (!prioridade) return null;

  return prioridade.charAt(0).toUpperCase() + prioridade.slice(1);
}

function formatarPrazo(dataEntrega: string, horaEntrega?: string | null) {
  if (!dataEntrega) return "Prazo não definido";

  const data = new Date(`${dataEntrega}T${horaEntrega || "00:00"}:00`);
  if (Number.isNaN(data.getTime())) {
    return horaEntrega ? `${dataEntrega} às ${horaEntrega}` : dataEntrega;
  }

  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);

  if (!horaEntrega) {
    return dataFormatada;
  }

  return `${dataFormatada} às ${horaEntrega.slice(0, 5)}`;
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

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function AvatarResponsavel({
  nome,
  avatarUrl,
}: {
  nome: string;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      <span className="relative h-6 w-6 overflow-hidden rounded-full">
        <Image
          src={avatarUrl}
          alt={nome}
          fill
          className="object-cover"
          sizes="24px"
        />
      </span>
    );
  }

  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
      style={{
        backgroundColor: "var(--surface-3)",
        color: "var(--text-2)",
        border: "1px solid var(--border)",
      }}
    >
      {iniciais(nome)}
    </span>
  );
}

function renderizarResponsaveis(item: ItemLista) {
  const responsaveisPersistidos =
    "responsaveis" in item && Array.isArray(item.responsaveis)
      ? item.responsaveis
      : [];

  if (responsaveisPersistidos.length > 0) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
          Responsáveis:
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {responsaveisPersistidos.map((responsavel) => (
            <div
              key={responsavel.id}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1"
              style={{
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--border)",
              }}
            >
              <AvatarResponsavel
                nome={responsavel.nome}
                avatarUrl={responsavel.avatarUrl ?? null}
              />
              <span
                className="max-w-[110px] truncate text-[11px]"
                style={{ color: "var(--text-3)" }}
                title={responsavel.nome}
              >
                {responsavel.nome}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if ("responsavelIds" in item && Array.isArray(item.responsavelIds) && item.responsavelIds.length > 0) {
    return (
      <div className="mt-3 text-[11px]" style={{ color: "var(--text-4)" }}>
        Responsáveis: {item.responsavelIds.length}
      </div>
    );
  }

  return null;
}

export function TarefaChecklistFilhas({
  titulo = "Tarefas de objetivo",
  itens,
  emptyLabel = "Nenhuma tarefa adicionada a este objetivo...",
  onAdicionar,
  onAbrirItem,
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
          const id = item.origem === "draft" ? item.idLocal : item.id;
          const origemDraft = item.origem === "draft";

          return (
            <article
              key={id}
              className="rounded-2xl border transition"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-0)",
              }}
            >
              <button
                type="button"
                onClick={() => onAbrirItem?.(item)}
                className="block w-full rounded-2xl p-4 text-left transition hover:opacity-95"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-medium text-[var(--text-1)]">
                      {item.titulo}
                    </h4>
                    <p className="mt-2 text-xs text-[var(--text-4)]">
                      Prazo: {formatarPrazo(item.dataEntrega, item.horaEntrega)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClasse(
                      item.status,
                    )}`}
                  >
                    {formatarStatus(item.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-4)]">
                  {item.prioridade ? (
                    <span className="badge-neutral rounded-full px-2 py-1">
                      {formatarPrioridade(item.prioridade)}
                    </span>
                  ) : null}

                  {origemDraft ? (
                    <span className="badge-neutral rounded-full px-2 py-1">
                      Rascunho
                    </span>
                  ) : null}
                </div>

                {renderizarResponsaveis(item)}
              </button>

              {origemDraft && onRemoverDraft ? (
                <div className="flex justify-end px-4 pb-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoverDraft(item.idLocal);
                    }}
                    className="text-xs font-medium transition"
                    style={{ color: "var(--text-4)" }}
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