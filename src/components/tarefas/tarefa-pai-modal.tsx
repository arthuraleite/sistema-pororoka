"use client";

import { useMemo, useState } from "react";

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

type PainelLateral = "filhas" | "comentarios";

function tituloModal(mode: Props["mode"]) {
  if (mode === "create") return "Novo objetivo";
  if (mode === "edit") return "Editar objetivo";
  return "Objetivo";
}

function formatarStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusClassName(status: StatusTarefa) {
  if (status === "concluida") return "status-success";
  if (status === "em_atraso") return "status-danger";
  if (status === "atencao") return "status-warning";
  if (status === "em_andamento") return "status-info";
  return "status-neutral";
}

function PainelAcordeao({
  id,
  titulo,
  aberto,
  onToggle,
  contador,
  children,
}: {
  id: PainelLateral;
  titulo: string;
  aberto: boolean;
  onToggle: (id: PainelLateral) => void;
  contador?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="panel-theme overflow-hidden rounded-[24px]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left interactive-surface"
        style={{ borderBottom: aberto ? "1px solid var(--border)" : "1px solid transparent" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-[var(--text-1)]">
            {titulo}
          </h3>

          {typeof contador === "number" ? (
            <span
              className="badge-neutral inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-medium"
            >
              {contador}
            </span>
          ) : null}
        </div>

        <span className="shrink-0 text-xs text-[var(--text-4)]">
          {aberto ? "▴" : "▾"}
        </span>
      </button>

      {aberto ? <div className="p-4">{children}</div> : null}
    </section>
  );
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
  const [painelAberto, setPainelAberto] = useState<PainelLateral>("filhas");

  const tituloCabecalho = useMemo(() => {
    if (mode === "create") return "Novo objetivo";
    return tarefa?.titulo?.trim() || tituloModal(mode);
  }, [mode, tarefa?.titulo]);

  const subtituloCabecalho = useMemo(() => {
    if (mode === "create") {
      return "Estruture um objetivo e defina responsáveis, prazo e contexto de execução.";
    }

    return "Acompanhe o objetivo, suas tarefas filhas e a conversa associada.";
  }, [mode]);

  if (!open) return null;

  const mostrarLateral = mode !== "create" && !!tarefa;

  return (
    <div className="overlay-backdrop fixed inset-0 z-50 overflow-y-auto p-3 md:p-5">
      <div className="flex min-h-full items-start justify-center">
        <div
          className="panel-theme flex w-full max-w-[1600px] flex-col overflow-hidden rounded-[28px]"
          style={{
            minHeight: "min(880px, calc(100vh - 24px))",
            maxHeight: "calc(100vh - 24px)",
          }}
        >
          <header
            className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 md:px-6"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-[var(--text-1)] md:text-2xl">
                {tituloCabecalho}
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-[var(--text-3)]">
                {subtituloCabecalho}
              </p>

              {tarefa && mode !== "create" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClassName(
                      tarefa.status,
                    )}`}
                  >
                    {formatarStatus(tarefa.status)}
                  </span>

                  {tarefa.prioridade ? (
                    <span className="badge-neutral inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                      Prioridade {tarefa.prioridade}
                    </span>
                  ) : null}

                  {tarefa.dataEntrega ? (
                    <span className="badge-neutral inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium">
                      Prazo {tarefa.dataEntrega}
                      {tarefa.horaEntrega ? ` às ${tarefa.horaEntrega.slice(0, 5)}` : ""}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </header>

          {tarefa && mode !== "create" ? (
            <div
              className="flex flex-wrap gap-2 px-5 py-4 md:px-6"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {mode === "view" ? (
                <button
                  type="button"
                  onClick={onEditRequest}
                  className="button-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                >
                  Editar objetivo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onViewRequest}
                  className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                >
                  Voltar para visualização
                </button>
              )}

              {onAddFilha ? (
                <button
                  type="button"
                  onClick={onAddFilha}
                  className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                >
                  Nova tarefa filha
                </button>
              ) : null}

              {tarefa.status !== "concluida" ? (
                <>
                  {(["a_fazer", "em_andamento", "atencao", "em_pausa"] as const)
                    .filter((status) => status !== tarefa.status)
                    .map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onAtualizarStatus?.(status)}
                        className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                      >
                        Marcar {formatarStatus(status)}
                      </button>
                    ))}
                </>
              ) : (
                <>
                  {(["a_fazer", "em_andamento", "atencao", "em_pausa"] as const).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onReabrir?.(status)}
                        className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                      >
                        Reabrir em {formatarStatus(status)}
                      </button>
                    ),
                  )}
                </>
              )}
            </div>
          ) : null}

          <div
            className={[
              "min-h-0 flex-1",
              mostrarLateral
                ? "grid xl:grid-cols-[minmax(0,1fr)_420px]"
                : "block",
            ].join(" ")}
          >
            <main className="min-h-0 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
              <div className="mx-auto max-w-[1120px]">
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
                          responsavelIds: tarefa.responsaveis.map((item) => item.id),
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
                        values.escopoObjetivo === null
                          ? undefined
                          : values.escopoObjetivo,
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
              </div>
            </main>

            {mostrarLateral ? (
              <aside
                className="min-h-0 overflow-y-auto px-5 py-5 md:px-6 md:py-6"
                style={{ borderLeft: "1px solid var(--border)" }}
              >
                <div className="space-y-4">
                  <PainelAcordeao
                    id="filhas"
                    titulo="Tarefas filhas"
                    contador={tarefa?.filhas?.length ?? 0}
                    aberto={painelAberto === "filhas"}
                    onToggle={setPainelAberto}
                  >
                    <TarefaChecklistFilhas
                      titulo="Checklist das filhas"
                      itens={tarefa?.filhas ?? []}
                    />
                  </PainelAcordeao>

                  <PainelAcordeao
                    id="comentarios"
                    titulo="Comentários"
                    contador={tarefa?.comentarios?.length ?? 0}
                    aberto={painelAberto === "comentarios"}
                    onToggle={setPainelAberto}
                  >
                    <TarefaComentariosPanel
                      comentarios={tarefa?.comentarios ?? []}
                      usuarioAtualId={usuarioAtualId}
                      podeModerar={podeModerarComentarios}
                      onAdicionar={onAdicionarComentario}
                      onEditar={onEditarComentario}
                      onExcluir={onExcluirComentario}
                      disabled={mode === "create"}
                    />
                  </PainelAcordeao>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}