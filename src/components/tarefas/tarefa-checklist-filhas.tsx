"use client";

import type { TarefaChecklistItem } from "@/types/tarefas/tarefas.types";

type Props = {
  titulo?: string;
  itens: TarefaChecklistItem[];
};

function statusClasse(status: TarefaChecklistItem["status"]) {
  switch (status) {
    case "em_atraso":
      return "border-red-800 bg-red-950/40 text-red-200";
    case "concluida":
      return "border-emerald-800 bg-emerald-950/40 text-emerald-200";
    case "atencao":
      return "border-amber-800 bg-amber-950/40 text-amber-200";
    case "em_andamento":
      return "border-sky-800 bg-sky-950/40 text-sky-200";
    case "em_pausa":
      return "border-violet-800 bg-violet-950/40 text-violet-200";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

export function TarefaChecklistFilhas({
  titulo = "Filhas",
  itens,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
          {titulo}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Em atraso primeiro, depois não concluídas e concluídas por último.
        </p>
      </div>

      {itens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-500">
          Nenhuma tarefa-filha vinculada ainda.
        </div>
      ) : null}

      <div className="space-y-3">
        {itens.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-medium text-zinc-100">
                {item.titulo}
              </h4>

              <span
                className={[
                  "rounded-lg border px-2 py-1 text-[11px] font-medium",
                  statusClasse(item.status),
                ].join(" ")}
              >
                {item.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
              <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1">
                {item.prioridade}
              </span>

              {item.equipe ? (
                <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1">
                  {item.equipe.nome}
                </span>
              ) : null}
            </div>

            <div className="mt-3 text-xs text-zinc-500">
              Prazo: {item.dataEntrega}
              {item.horaEntrega ? ` às ${item.horaEntrega}` : ""}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}