"use client";

import { TarefaChecklistFilhas } from "@/components/tarefas/tarefa-checklist-filhas";
import type { TarefaDashboardData } from "@/types/tarefas/tarefas.types";

type Props = {
  data: TarefaDashboardData | null;
  onOpenTask?: (taskId: string) => void;
};

export function TarefasDashboardWidgets({ data, onOpenTask }: Props) {
  if (!data) return null;

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <div
        className="rounded-3xl p-5"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-1)",
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
          Minhas tarefas da semana
        </h2>

        <div className="mt-4 space-y-4">
          {data.minhasTarefasSemana.atrasadas.length > 0 ? (
            <div
              className="rounded-2xl p-4"
              style={{
                border: "1px solid #6b2328",
                backgroundColor: "var(--danger)",
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                Em atraso
              </p>

              <div className="mt-3 space-y-2">
                {data.minhasTarefasSemana.atrasadas.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenTask?.(item.id)}
                    className="block w-full rounded-2xl p-3 text-left transition"
                    style={{
                      border: "1px solid #6b2328",
                      backgroundColor: "var(--surface-0)",
                    }}
                  >
                    <div className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      {item.titulo}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                      Prazo: {item.prazo}
                      {item.horaEntrega ? ` às ${item.horaEntrega}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {data.minhasTarefasSemana.dias.length === 0 ? (
            <div
              className="rounded-2xl p-4 text-sm"
              style={{
                border: "1px dashed var(--border)",
                backgroundColor: "var(--surface-0)",
                color: "var(--text-3)",
              }}
            >
              Nenhuma tarefa da semana disponível.
            </div>
          ) : (
            data.minhasTarefasSemana.dias.map((dia) => (
              <div
                key={dia.data}
                className="rounded-2xl p-4"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface-0)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      {dia.diaSemana}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>
                      {dia.data}
                    </p>
                  </div>

                  <span
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface-1)",
                      color: "var(--text-3)",
                    }}
                  >
                    {dia.tarefas.length}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {dia.tarefas.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenTask?.(item.id)}
                      className="block w-full rounded-2xl p-3 text-left transition"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--surface-2)",
                      }}
                    >
                      <div className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                        {item.titulo}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                        {item.horaEntrega ? `${item.horaEntrega} • ` : ""}
                        {item.prioridade ?? "sem prioridade"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="rounded-3xl p-5"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-1)",
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
          Minhas tarefas a fazer
        </h2>

        <div className="mt-4 space-y-2">
          {data.minhasTarefasAFazer.itens.length === 0 ? (
            <div
              className="rounded-2xl p-4 text-sm"
              style={{
                border: "1px dashed var(--border)",
                backgroundColor: "var(--surface-0)",
                color: "var(--text-3)",
              }}
            >
              Nenhuma tarefa neste bloco.
            </div>
          ) : (
            data.minhasTarefasAFazer.itens.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenTask?.(item.id)}
                className="block w-full rounded-2xl p-3 text-left transition"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                    {item.titulo}
                  </div>
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-4)" }}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
                  Prazo: {item.prazo}
                  {item.horaEntrega ? ` às ${item.horaEntrega}` : ""}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div
        className="rounded-3xl p-5"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-1)",
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
          Acompanhamento de macros
        </h2>

        <div className="mt-4 space-y-4">
          {!data.acompanhamentoMacros || data.acompanhamentoMacros.itens.length === 0 ? (
            <div
              className="rounded-2xl p-4 text-sm"
              style={{
                border: "1px dashed var(--border)",
                backgroundColor: "var(--surface-0)",
                color: "var(--text-3)",
              }}
            >
              Nenhuma macro disponível para acompanhamento.
            </div>
          ) : (
            data.acompanhamentoMacros.itens.map((macro) => (
              <div
                key={macro.id}
                className="rounded-2xl p-4"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface-0)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      {macro.titulo}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>
                      {macro.totalFilhasConcluidas}/{macro.totalFilhas} concluídas
                    </p>
                  </div>

                  <span
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface-1)",
                      color: "var(--text-2)",
                    }}
                  >
                    {macro.percentualConclusao}%
                  </span>
                </div>

                <div className="mt-4">
                  <TarefaChecklistFilhas titulo="Filhas" itens={macro.filhas} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
