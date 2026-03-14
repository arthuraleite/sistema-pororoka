"use client";

import { TarefaChecklistFilhas } from "@/components/tarefas/tarefa-checklist-filhas";
import { TarefaComentariosPanel } from "@/components/tarefas/tarefa-comentarios-panel";
import { TarefaFormBase } from "@/components/tarefas/tarefa-form-base";
import type {
  EscopoObjetivo,
  StatusTarefa,
  TarefaDetalhe,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type Props = {
  open: boolean;
  mode: "create" | "edit" | "view";
  tarefa?: TarefaDetalhe | null;
  usuarios: UsuarioResumoTarefa[];
  usuarioAtualId?: string | null;
  podeModerarComentarios?: boolean;
  podeSelecionarObjetivoGlobal?: boolean;
  equipes?: Array<{ id: string; nome: string }>;
  onClose: () => void;
  onEditRequest?: () => void;
  onViewRequest?: () => void;
  onReabrir?: (
    novoStatus: Exclude<StatusTarefa, "concluida" | "em_atraso">,
  ) => void | Promise<void>;
  onAtualizarStatus?: (novoStatus: StatusTarefa) => void | Promise<void>;
  onSubmit?: (values: {
    tipo: "pai";
    escopoObjetivo?: EscopoObjetivo;
    equipeId?: string | null;
    titulo: string;
    descricao?: string | null;
    projetoId?: string | null;
    prioridade?: "urgente" | "alta" | "media" | "baixa" | null;
    status?:
      | "a_fazer"
      | "em_andamento"
      | "atencao"
      | "em_pausa"
      | "em_atraso"
      | "concluida";
    dataEntrega: string;
    horaEntrega?: string | null;
    responsavelIds: string[];
    links: Array<{ id?: string; url: string; texto?: string | null }>;
  }) => void | Promise<void>;
  onAddFilha?: () => void;
  onAdicionarComentario?: (values: {
    conteudo: string;
    linkExterno?: string | null;
    comentarioPaiId?: string | null;
  }) => void | Promise<void>;
  onEditarComentario?: (values: {
    comentarioId: string;
    conteudo: string;
    linkExterno?: string | null;
  }) => void | Promise<void>;
  onExcluirComentario?: (comentarioId: string) => void | Promise<void>;
};

function tituloModal(mode: Props["mode"]) {
  if (mode === "create") return "Novo objetivo";
  if (mode === "edit") return "Editar objetivo";
  return "Objetivo";
}

function formatarStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function TarefaPaiModal({
  open,
  mode,
  tarefa,
  usuarios,
  usuarioAtualId,
  podeModerarComentarios = false,
  podeSelecionarObjetivoGlobal = false,
  equipes = [],
  onClose,
  onEditRequest,
  onViewRequest,
  onReabrir,
  onAtualizarStatus,
  onSubmit,
  onAddFilha,
  onAdicionarComentario,
  onEditarComentario,
  onExcluirComentario,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center py-4">
        <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {tituloModal(mode)}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Objetivo com acompanhamento das tarefas-filhas vinculadas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {mode !== "create" ? (
                <button
                  type="button"
                  onClick={onAddFilha}
                  className="rounded-xl border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                >
                  Adicionar filha
                </button>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700"
              >
                Fechar
              </button>
            </div>
          </div>

          {tarefa && mode !== "create" ? (
            <div className="flex flex-wrap gap-2 border-b border-zinc-800 px-6 py-3">
              {mode === "view" ? (
                <button
                  type="button"
                  onClick={onEditRequest}
                  className="rounded-xl border border-zinc-700 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
                >
                  Editar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onViewRequest}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700"
                >
                  Voltar para visualização
                </button>
              )}

              {tarefa.status !== "concluida" ? (
                <div className="flex flex-wrap gap-2">
                  {(
                    ["a_fazer", "em_andamento", "atencao", "em_pausa"] as const
                  )
                    .filter((status) => status !== tarefa.status)
                    .map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onAtualizarStatus?.(status)}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700"
                      >
                        Marcar {formatarStatus(status)}
                      </button>
                    ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(
                    ["a_fazer", "em_andamento", "atencao", "em_pausa"] as const
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onReabrir?.(status)}
                      className="rounded-xl border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-200 transition hover:bg-amber-950/60"
                    >
                      Reabrir em {formatarStatus(status)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="min-h-0 grid flex-1 gap-0 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <div className="min-h-0 overflow-y-auto border-b border-zinc-800 px-6 py-6 xl:border-b-0 xl:border-r">
              <div className="space-y-6">
                <TarefaFormBase
                  mode={mode}
                  tipo="pai"
                  usuarios={usuarios}
                  equipes={equipes}
                  allowProjeto
                  allowEquipe
                  allowPrioridade
                  allowStatus={mode !== "create"}
                  allowEscopoObjetivo
                  canSelectObjetivoGlobal={podeSelecionarObjetivoGlobal}
                  initialValues={
                    tarefa?.tipo === "pai"
                      ? {
                          titulo: tarefa.titulo,
                          descricao: tarefa.descricao,
                          projetoId: tarefa.projetoId,
                          escopoObjetivo: tarefa.escopoObjetivo,
                          equipeId: tarefa.equipeId,
                          prioridade: tarefa.prioridade,
                          status: tarefa.status,
                          dataEntrega: tarefa.dataEntrega,
                          horaEntrega: tarefa.horaEntrega,
                          responsavelIds: tarefa.responsaveis.map(
                            (item) => item.id,
                          ),
                          links: tarefa.links,
                        }
                      : undefined
                  }
                  onSubmit={async (values) => {
                    if (!onSubmit) return;

                    await onSubmit({
                      ...values,
                      tipo: "pai",
                      escopoObjetivo:
                        values.escopoObjetivo === null ? undefined : values.escopoObjetivo,
                    });
                  }}
                  submitLabel={
                    mode === "create"
                      ? "Criar objetivo"
                      : mode === "edit"
                        ? "Salvar alterações"
                        : "Fechar"
                  }
                />

                {tarefa ? (
                  <TarefaComentariosPanel
                    comentarios={tarefa.comentarios}
                    usuarioAtualId={usuarioAtualId}
                    podeModerar={podeModerarComentarios}
                    onAdicionar={onAdicionarComentario}
                    onEditar={onEditarComentario}
                    onExcluir={onExcluirComentario}
                    disabled={mode === "create"}
                  />
                ) : null}
              </div>
            </div>

            <aside className="min-h-0 overflow-y-auto px-6 py-6">
              <TarefaChecklistFilhas
                titulo="Checklist das filhas"
                itens={tarefa?.filhas ?? []}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}