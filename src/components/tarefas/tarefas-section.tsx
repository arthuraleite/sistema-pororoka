"use client";

import type { EquipeTarefaOption } from "@/actions/tarefas/listar-equipes-tarefas";
import { TarefasFilters } from "@/components/tarefas/tarefas-filters";
import { TarefasKanban } from "@/components/tarefas/tarefas-kanban";
import { TarefasTable } from "@/components/tarefas/tarefas-table";
import { TarefasViewSwitcher } from "@/components/tarefas/tarefas-view-switcher";
import { TarefasWeekCalendar } from "@/components/tarefas/tarefas-calendar";
import type {
  Tarefa,
  TarefaKanbanCard,
  TarefasFiltros,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type ViewMode = "kanban" | "table" | "week";

type Props = {
  view: ViewMode;
  onChangeView: (view: ViewMode) => void;
  tarefas: Tarefa[];
  cardsKanban: TarefaKanbanCard[];
  filtros: TarefasFiltros;
  onChangeFiltros: (filtros: TarefasFiltros) => void;
  usuarios: UsuarioResumoTarefa[];
  equipes: EquipeTarefaOption[];
  podeVerObjetivos: boolean;
  podeVerTodasEquipes: boolean;
  objetivosTituloMap: Map<string, string>;
  onCriarTarefa: () => void;
  onAbrirTarefa: (taskId: string) => void;
  onMoverCardKanban: (
    cardId: string,
    novoStatus: TarefaKanbanCard["status"],
  ) => void | Promise<void>;
};

export function TarefasSection({
  view,
  onChangeView,
  tarefas,
  cardsKanban,
  filtros,
  onChangeFiltros,
  usuarios,
  equipes,
  podeVerObjetivos,
  podeVerTodasEquipes,
  objetivosTituloMap,
  onCriarTarefa,
  onAbrirTarefa,
  onMoverCardKanban,
}: Props) {
  return (
    <section
      className="rounded-[28px] p-4 shadow-sm backdrop-blur-sm md:p-5"
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-1)]">
              Tarefas
            </h2>
            <span
              className="rounded-full px-2.5 py-1 text-[11px]"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-0)",
                color: "var(--text-3)",
              }}
            >
              {tarefas.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-[var(--text-3)]">
            Acompanhe tarefas de objetivo e tarefas avulsas nas diferentes
            visualizações do módulo.
          </p>
        </div>

        <button
          type="button"
          onClick={onCriarTarefa}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium transition"
          style={{
            backgroundColor: "var(--button-primary)",
            color: "var(--button-primary-foreground)",
            border: "1px solid transparent",
          }}
        >
          Adicionar tarefa
        </button>
      </div>

      <TarefasFilters
        contexto="tarefas"
        filtros={filtros}
        usuarios={usuarios}
        equipes={podeVerTodasEquipes ? equipes : []}
        onChange={onChangeFiltros}
        compact
      />

      <div className="mt-4">
        <div className="px-1">
          <TarefasViewSwitcher value={view} onChange={onChangeView} />
        </div>

        <div
          className="rounded-b-[24px] rounded-tr-[24px] p-3 md:p-4"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-0)",
          }}
        >
          {view === "kanban" ? (
            tarefas.length > 0 ? (
              <TarefasKanban
                cards={cardsKanban}
                ordenacao={filtros.ordenacao ?? "data_entrega"}
                onOpenTask={onAbrirTarefa}
                onMoveTask={onMoverCardKanban}
                hideTipoBadge={!podeVerObjetivos}
                showEquipeBadge={podeVerTodasEquipes}
              />
            ) : (
              <div
                className="rounded-2xl p-6 text-sm text-[var(--text-3)]"
                style={{
                  border: "1px dashed var(--border)",
                  backgroundColor: "var(--surface-0)",
                }}
              >
                Nenhuma tarefa encontrada com os filtros atuais.
              </div>
            )
          ) : view === "table" ? (
            tarefas.length > 0 ? (
              <TarefasTable
                tarefas={tarefas}
                onOpenTask={onAbrirTarefa}
                hideTipoInfo={!podeVerObjetivos}
                showEquipeColuna={podeVerTodasEquipes}
                objetivosTituloMap={objetivosTituloMap}
              />
            ) : (
              <div
                className="rounded-2xl p-6 text-sm text-[var(--text-3)]"
                style={{
                  border: "1px dashed var(--border)",
                  backgroundColor: "var(--surface-0)",
                }}
              >
                Nenhuma tarefa encontrada com os filtros atuais.
              </div>
            )
          ) : tarefas.length > 0 ? (
            <TarefasWeekCalendar
              tarefas={tarefas}
              onOpenTask={onAbrirTarefa}
              showEquipeInfo={podeVerTodasEquipes}
            />
          ) : (
            <div
              className="rounded-2xl p-6 text-sm text-[var(--text-3)]"
              style={{
                border: "1px dashed var(--border)",
                backgroundColor: "var(--surface-0)",
              }}
            >
              Nenhuma tarefa encontrada com os filtros atuais.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}