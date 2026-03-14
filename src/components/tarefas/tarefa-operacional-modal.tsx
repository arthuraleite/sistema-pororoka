"use client";

import { TarefaComentariosPanel } from "@/components/tarefas/tarefa-comentarios-panel";
import { TarefaFormBase } from "@/components/tarefas/tarefa-form-base";
import type {
  CategoriaTarefa,
  StatusTarefa,
  TarefaDetalhe,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type EquipeOption = {
  id: string;
  nome: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit" | "view";
  tipo: "filha" | "orfa";
  tarefa?: TarefaDetalhe | null;
  usuarios: UsuarioResumoTarefa[];
  usuarioAtualId?: string | null;
  podeModerarComentarios?: boolean;
  equipes: EquipeOption[];
  categorias: CategoriaTarefa[];
  tarefasPaiOptions?: Array<{ id: string; titulo: string }>;
  onClose: () => void;
  onEditRequest?: () => void;
  onViewRequest?: () => void;
  onExcluir?: () => void | Promise<void>;
  onReabrir?: (
    novoStatus: Exclude<StatusTarefa, "concluida" | "em_atraso">,
  ) => void | Promise<void>;
  onAtualizarStatus?: (novoStatus: StatusTarefa) => void | Promise<void>;
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
  onSubmit?: (values: {
    tipo: "filha" | "orfa";
    titulo: string;
    descricao?: string | null;
    tarefaPaiId?: string | null;
    equipeId?: string | null;
    categoriaId?: string | null;
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
};

function tituloModal(mode: Props["mode"], tipo: Props["tipo"]) {
  const nome = tipo === "filha" ? "Tarefa filha" : "Tarefa órfã";

  if (mode === "create") return `Nova ${nome}`;
  if (mode === "edit") return `Editar ${nome}`;
  return nome;
}

export function TarefaOperacionalModal({
  open,
  mode,
  tipo,
  tarefa,
  usuarios,
  usuarioAtualId,
  podeModerarComentarios = false,
  equipes,
  categorias,
  tarefasPaiOptions = [],
  onClose,
  onEditRequest,
  onViewRequest,
  onExcluir,
  onReabrir,
  onAtualizarStatus,
  onSubmit,
  onAdicionarComentario,
  onEditarComentario,
  onExcluirComentario,
}: Props) {
  if (!open) return null;

  const equipeId = tarefa && tarefa.tipo !== "pai" ? tarefa.equipeId : null;

  const categoriasDisponiveis = equipeId
    ? categorias.filter((categoria) => categoria.equipeId === equipeId)
    : categorias;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center py-4">
        <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {tituloModal(mode, tipo)}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Modal compartilhado para criação, edição e visualização
                operacional.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700"
            >
              Fechar
            </button>
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
                <button
                  type="button"
                  onClick={() => onAtualizarStatus?.("concluida")}
                  className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-950/60"
                >
                  Concluir
                </button>
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
                      Reabrir em {status.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
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
                        Marcar {status.replaceAll("_", " ")}
                      </button>
                    ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={onExcluir}
                className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200 transition hover:bg-red-950/60"
              >
                Excluir tarefa
              </button>
            </div>
          ) : null}

          <div className="min-h-0 grid flex-1 gap-0 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <div className="min-h-0 overflow-y-auto border-b border-zinc-800 px-6 py-6 xl:border-b-0 xl:border-r">
              <div className="space-y-6">
                <TarefaFormBase
                  mode={mode}
                  tipo={tipo}
                  usuarios={usuarios}
                  equipes={equipes}
                  categorias={categoriasDisponiveis}
                  tarefasPaiOptions={tarefasPaiOptions}
                  allowEquipe
                  allowCategoria
                  allowPrioridade
                  allowStatus={mode !== "create"}
                  initialValues={
                    tarefa && tarefa.tipo !== "pai"
                      ? {
                          titulo: tarefa.titulo,
                          descricao: tarefa.descricao,
                          tarefaPaiId:
                            tarefa.tipo === "filha" ? tarefa.tarefaPaiId : null,
                          equipeId: tarefa.equipeId,
                          categoriaId: tarefa.categoriaId,
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
                      tipo,
                    });
                  }}
                  submitLabel={
                    mode === "create"
                      ? "Criar tarefa"
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
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-200">
                  Contexto da tarefa
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Este espaço pode receber, nas próximas etapas, histórico de
                  responsáveis, notificações relacionadas e resumo operacional.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}