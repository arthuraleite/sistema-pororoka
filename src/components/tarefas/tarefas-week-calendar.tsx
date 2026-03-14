"use client";

import type { TarefaCalendarioDia } from "@/types/tarefas/tarefas.types";

type Props = {
  dias: TarefaCalendarioDia[];
  onOpenTask?: (taskId: string) => void;
};

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function formatarStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function TarefasWeekCalendar({ dias, onOpenTask }: Props) {
  if (dias.length === 0) {
    return (
      <section
        className="rounded-3xl p-6"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-1)",
        }}
      >
        <div
          className="rounded-2xl p-5 text-sm"
          style={{
            border: "1px dashed var(--border)",
            backgroundColor: "var(--surface-0)",
            color: "var(--text-3)",
          }}
        >
          Nenhuma tarefa encontrada para o calendário semanal.
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {dias.map((dia) => (
        <div
          key={dia.data}
          className="rounded-3xl p-5"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-1)",
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                {dia.data}
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
              {dia.itens.length}
            </span>
          </div>

          <div className="space-y-3">
            {dia.itens.map((item) => {
              const Wrapper = onOpenTask ? "button" : "article";

              return (
                <Wrapper
                  key={item.id}
                  {...(onOpenTask
                    ? {
                        type: "button" as const,
                        onClick: () => onOpenTask(item.id),
                      }
                    : {})}
                  className="w-full rounded-2xl p-4 text-left transition"
                  style={{
                    border: `1px solid ${item.emAtraso ? "#6b2328" : "var(--border)"}`,
                    backgroundColor: "var(--surface-2)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                      {item.titulo}
                    </h3>
                    <span
                      className="text-[11px] uppercase tracking-wide"
                      style={{ color: "var(--text-4)" }}
                    >
                      {formatarStatus(item.status)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs" style={{ color: "var(--text-3)" }}>
                    {item.horaEntrega ? `Horário: ${item.horaEntrega}` : "Sem horário"}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.equipe ? (
                      <span
                        className="rounded-lg px-2 py-1 text-[11px]"
                        style={{
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--surface-0)",
                          color: "var(--text-2)",
                        }}
                      >
                        {item.equipe.nome}
                      </span>
                    ) : null}

                    {item.categoria ? (
                      <span
                        className="rounded-lg px-2 py-1 text-[11px]"
                        style={{
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--surface-0)",
                          color: "var(--text-2)",
                        }}
                      >
                        {item.categoria.nome}
                      </span>
                    ) : null}

                    {item.prioridade ? (
                      <span
                        className="rounded-lg px-2 py-1 text-[11px]"
                        style={{
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--surface-0)",
                          color: "var(--text-2)",
                        }}
                      >
                        {item.prioridade}
                      </span>
                    ) : null}
                  </div>

                  {item.responsaveis.length > 0 ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {item.responsaveis.slice(0, 3).map((responsavel) => (
                        <div
                          key={responsavel.id}
                          className="flex items-center gap-2 rounded-full px-2.5 py-1"
                          title={responsavel.nome}
                          style={{
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--surface-0)",
                          }}
                        >
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: "var(--surface-3)",
                              color: "var(--text-2)",
                            }}
                          >
                            {iniciais(responsavel.nome)}
                          </span>
                          <span className="max-w-[90px] truncate text-[11px]" style={{ color: "var(--text-2)" }}>
                            {responsavel.nome}
                          </span>
                        </div>
                      ))}

                      {item.responsaveis.length > 3 ? (
                        <span className="rounded-full px-2.5 py-1 text-[11px]" style={{ color: "var(--text-4)" }}>
                          +{item.responsaveis.length - 3}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </Wrapper>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
