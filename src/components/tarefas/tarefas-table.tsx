"use client";

import type { Tarefa } from "@/types/tarefas/tarefas.types";

type Props = {
  tarefas: Tarefa[];
  onOpenTask?: (taskId: string) => void;
};

function formatarTipo(tipo: Tarefa["tipo"]) {
  if (tipo === "pai") return "Objetivo";
  if (tipo === "filha") return "Tarefa de Objetivo";
  return "Tarefa";
}

function formatarStatus(status: Tarefa["status"]) {
  return status.replaceAll("_", " ");
}

function formatarPrioridade(prioridade: Tarefa["prioridade"]) {
  return prioridade ?? "—";
}

export function TarefasTable({ tarefas, onOpenTask }: Props) {
  return (
    <section
      className="overflow-hidden rounded-3xl"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface-1)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead style={{ backgroundColor: "var(--surface-0)" }}>
            <tr
              className="text-left text-xs uppercase tracking-wide"
              style={{ color: "var(--text-4)" }}
            >
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Equipe</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Prazo</th>
            </tr>
          </thead>

          <tbody className="text-sm" style={{ color: "var(--text-2)" }}>
            {tarefas.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center"
                  style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}
                >
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            ) : null}

            {tarefas.map((tarefa, index) => (
              <tr
                key={tarefa.id}
                className="cursor-pointer transition"
                onClick={() => onOpenTask?.(tarefa.id)}
                style={{
                  backgroundColor: index % 2 === 0 ? "var(--surface-1)" : "var(--surface-2)",
                }}
              >
                <td
                  className="px-4 py-4 font-medium"
                  style={{ color: "var(--text-1)", borderTop: "1px solid var(--border)" }}
                >
                  {tarefa.titulo}
                </td>
                <td className="px-4 py-4" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                  {formatarTipo(tarefa.tipo)}
                </td>
                <td className="px-4 py-4" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                  {tarefa.tipo === "pai" ? "—" : tarefa.equipe?.nome ?? "—"}
                </td>
                <td className="px-4 py-4" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                  {tarefa.tipo === "pai" ? "—" : tarefa.categoria?.nome ?? "—"}
                </td>
                <td className="px-4 py-4" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                  {formatarStatus(tarefa.status)}
                </td>
                <td className="px-4 py-4" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                  {formatarPrioridade(tarefa.prioridade)}
                </td>
                <td className="px-4 py-4" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>
                  {tarefa.dataEntrega}
                  {tarefa.horaEntrega ? ` às ${tarefa.horaEntrega}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
