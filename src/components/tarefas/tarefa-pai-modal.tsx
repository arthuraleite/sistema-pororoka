"use client";

import { useMemo, useState } from "react";

import { TarefaAtualizacoesPanel } from "@/components/tarefas/tarefa-atualizacoes-panel";
import { TarefaChecklistFilhas } from "@/components/tarefas/tarefa-checklist-filhas";
import { TarefaComentariosPanel } from "@/components/tarefas/tarefa-comentarios-panel";
import { TarefaFilhaQuickModal } from "@/components/tarefas/tarefa-filha-quick-modal";
import { TarefaFormBase } from "@/components/tarefas/tarefa-form-base";
import { TarefaModalShell } from "@/components/tarefas/tarefa-modal-shell";
import { useTarefaPaiDraft } from "@/components/tarefas/hooks/use-tarefa-pai-draft";
import type {
  CategoriaTarefa,
  EscopoObjetivo,
  StatusTarefa,
  TarefaDetalhe,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type EquipeOption = {
  id: string;
  nome: string;
};

type PayloadObjetivo = {
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
};

type Props = {
  open: boolean;
  isNew: boolean;
  tarefa?: TarefaDetalhe | null;
  usuarios: UsuarioResumoTarefa[];
  categorias?: CategoriaTarefa[];
  usuarioAtualId?: string | null;
  podeModerarComentarios?: boolean;
  podeSelecionarObjetivoGlobal?: boolean;
  equipes?: EquipeOption[];
  submitting?: boolean;
  onClose: () => void;
  onReabrir?: (
    novoStatus: Exclude<StatusTarefa, "concluida" | "em_atraso">,
  ) => void | Promise<void>;
  onAtualizarStatus?: (novoStatus: StatusTarefa) => void | Promise<void>;
  onExcluir?: () => void | Promise<void>;
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
  onSubmit?: (
    values: PayloadObjetivo,
    extras?: {
      filhasDraft: ReturnType<typeof useTarefaPaiDraft>["filhas"];
      comentariosDraft: ReturnType<typeof useTarefaPaiDraft>["comentarios"];
    },
  ) => void | Promise<void>;
};

function formatarStatus(status?: string | null) {
  if (!status) return "Não definido";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function formatarPrazo(data?: string | null, hora?: string | null) {
  if (!data) return "Prazo não definido";

  const dataRef = new Date(`${data}T00:00:00`);
  const dataFormatada = Number.isNaN(dataRef.getTime())
    ? data
    : new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(dataRef);

  if (!hora) {
    return dataFormatada;
  }

  return `${dataFormatada} às ${hora.slice(0, 5)}`;
}

function getTituloModal(isNew: boolean, tarefa?: TarefaDetalhe | null) {
  if (isNew) {
    return "Novo objetivo";
  }

  return tarefa?.titulo?.trim() || "Objetivo";
}

function getSubtituloModal(isNew: boolean) {
  if (isNew) {
    return "Preencha o objetivo e já organize filhas, comentários e atualizações antes de salvar.";
  }

  return "Edite o objetivo diretamente, acompanhe filhas, comentários e o histórico automático.";
}

function toEscopoObjetivo(
  value: unknown,
): "global" | "equipe" | undefined {
  return value === "global" || value === "equipe" ? value : undefined;
}

export function TarefaPaiModal({
  open,
  isNew,
  tarefa,
  usuarios,
  categorias = [],
  usuarioAtualId,
  podeModerarComentarios = false,
  podeSelecionarObjetivoGlobal = false,
  equipes = [],
  submitting = false,
  onClose,
  onReabrir,
  onAtualizarStatus,
  onExcluir,
  onAddFilha,
  onAdicionarComentario,
  onEditarComentario,
  onExcluirComentario,
  onSubmit,
}: Props) {
  const draft = useTarefaPaiDraft();
  const [quickFilhaOpen, setQuickFilhaOpen] = useState(false);

  const tituloCabecalho = useMemo(
    () => getTituloModal(isNew, tarefa),
    [isNew, tarefa],
  );

  const subtituloCabecalho = useMemo(
    () => getSubtituloModal(isNew),
    [isNew],
  );

  const initialValues =
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
      : undefined;

  const objetivoEhEquipe =
    (isNew
      ? initialValues?.escopoObjetivo
      : tarefa?.tipo === "pai"
        ? tarefa.escopoObjetivo
        : undefined) === "equipe";

  const equipePredefinidaId =
    objetivoEhEquipe && (isNew ? initialValues?.equipeId : tarefa?.equipeId)
      ? (isNew ? initialValues?.equipeId : tarefa?.equipeId) ?? null
      : null;

  const bloquearEquipeFilha = Boolean(objetivoEhEquipe && equipePredefinidaId);

  const filhasSidebar = isNew
    ? draft.filhas.map((filha) => ({
        ...filha,
        id: filha.idLocal,
        origem: "draft" as const,
      }))
    : (tarefa?.filhas ?? []).map((filha) => ({
        ...filha,
        origem: "persistida" as const,
      }));

  const atualizacoesSidebar = useMemo(() => {
    if (isNew) {
      return draft.atualizacoes.map((item) => ({
        id: item.idLocal,
        descricao: item.descricao,
        criadoEm: item.criadoEm,
      }));
    }

    const itens: Array<{ id: string; descricao: string; criadoEm: string }> = [];

    if (tarefa?.dataCriacao) {
      itens.push({
        id: `criacao_${tarefa.id}`,
        descricao: "Objetivo criado.",
        criadoEm: tarefa.dataCriacao,
      });
    }

    if (
      tarefa?.dataAtualizacao &&
      tarefa.dataAtualizacao !== tarefa.dataCriacao
    ) {
      itens.push({
        id: `edicao_${tarefa.id}`,
        descricao: "Objetivo atualizado.",
        criadoEm: tarefa.dataAtualizacao,
      });
    }

    for (const comentario of tarefa?.comentarios ?? []) {
      itens.push({
        id: `comentario_${comentario.id}`,
        descricao: "Comentário adicionado.",
        criadoEm: comentario.dataCriacao,
      });
    }

    return itens.sort(
      (a, b) =>
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  }, [draft.atualizacoes, isNew, tarefa]);

  async function handleSubmit(values: {
    tipo: "pai" | "filha" | "orfa";
    titulo: string;
    descricao?: string | null;
    tarefaPaiId?: string | null;
    equipeId?: string | null;
    categoriaId?: string | null;
    projetoId?: string | null;
    escopoObjetivo?: string | null;
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
  }) {
    if (!onSubmit) return;
    if (values.tipo !== "pai") return;

    const payload: PayloadObjetivo = {
      tipo: "pai",
      escopoObjetivo: toEscopoObjetivo(values.escopoObjetivo),
      equipeId: values.equipeId ?? null,
      titulo: values.titulo,
      descricao: values.descricao ?? null,
      projetoId: values.projetoId ?? null,
      prioridade: values.prioridade ?? null,
      status: values.status,
      dataEntrega: values.dataEntrega,
      horaEntrega: values.horaEntrega ?? null,
      responsavelIds: values.responsavelIds,
      links: values.links,
    };

    await onSubmit(payload, {
      filhasDraft: draft.filhas,
      comentariosDraft: draft.comentarios,
    });

    if (isNew) {
      draft.reset();
    }
  }

  async function handleAdicionarComentario(values: {
    conteudo: string;
    linkExterno?: string | null;
    comentarioPaiId?: string | null;
  }) {
    if (isNew) {
      draft.adicionarComentario(values);
      return;
    }

    await onAdicionarComentario?.(values);
  }

  async function handleEditarComentario(values: {
    comentarioId: string;
    conteudo: string;
    linkExterno?: string | null;
  }) {
    if (isNew) {
      draft.editarComentario(values.comentarioId, {
        conteudo: values.conteudo,
        linkExterno: values.linkExterno ?? null,
      });
      return;
    }

    await onEditarComentario?.(values);
  }

  async function handleExcluirComentario(comentarioId: string) {
    if (isNew) {
      draft.removerComentario(comentarioId);
      return;
    }

    await onExcluirComentario?.(comentarioId);
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <TarefaModalShell
        open={open}
        title={tituloCabecalho}
        subtitle={subtituloCabecalho}
        onClose={onClose}
        main={
          <div className="space-y-5">
            {!isNew && tarefa?.tipo === "pai" ? (
              <section
                className="rounded-[var(--radius-2xl)] border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-0)",
                }}
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.14em]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Status
                    </p>
                    <p
                      className="mt-1 text-sm font-medium"
                      style={{ color: "var(--text-2)" }}
                    >
                      {formatarStatus(tarefa.status)}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.14em]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Prioridade
                    </p>
                    <p
                      className="mt-1 text-sm font-medium"
                      style={{ color: "var(--text-2)" }}
                    >
                      {tarefa.prioridade
                        ? formatarStatus(tarefa.prioridade)
                        : "Não definida"}
                    </p>
                  </div>

                  <div>
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.14em]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Prazo
                    </p>
                    <p
                      className="mt-1 text-sm font-medium"
                      style={{ color: "var(--text-2)" }}
                    >
                      {formatarPrazo(tarefa.dataEntrega, tarefa.horaEntrega)}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="mx-auto w-full max-w-[1120px]">
              <TarefaFormBase
                mode={isNew ? "create" : "edit"}
                tipo="pai"
                usuarios={usuarios}
                categorias={categorias}
                equipes={equipes}
                allowProjeto
                allowEquipe
                allowPrioridade
                allowStatus={!isNew}
                allowEscopoObjetivo
                canSelectObjetivoGlobal={podeSelecionarObjetivoGlobal}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                submitLabel={isNew ? "Salvar objetivo" : "Salvar alterações"}
                formId="form-tarefa-pai"
              />
            </div>
          </div>
        }
        sidebar={
          <div className="space-y-4">
            <section
              className="rounded-[var(--radius-2xl)] border p-4"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-0)",
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-1)" }}
                  >
                    Tarefas filhas
                  </h3>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    Organize as entregas vinculadas a este objetivo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onAddFilha) {
                      onAddFilha();
                      return;
                    }

                    setQuickFilhaOpen(true);
                  }}
                  className="button-neutral inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium"
                >
                  + Adicionar
                </button>
              </div>

              <TarefaChecklistFilhas
                titulo="Checklist das filhas"
                itens={filhasSidebar}
                emptyLabel="Nenhuma tarefa filha adicionada ainda."
                onRemoverDraft={draft.removerFilha}
              />
            </section>

            <section
              className="rounded-[var(--radius-2xl)] border p-4"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-0)",
              }}
            >
              <div className="mb-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  Comentários
                </h3>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--text-3)" }}
                >
                  Registre a conversa e os pontos importantes do objetivo.
                </p>
              </div>

              <TarefaComentariosPanel
                comentarios={tarefa?.comentarios ?? []}
                comentariosDraft={isNew ? draft.comentarios : []}
                usuarioAtualId={usuarioAtualId}
                usuarioAtualNome={
                  usuarios.find((usuario) => usuario.id === usuarioAtualId)?.nome ?? null
                }
                usuarioAtualAvatarUrl={
                  usuarios.find((usuario) => usuario.id === usuarioAtualId)?.avatarUrl ?? null
                }
                podeModerar={podeModerarComentarios}
                onAdicionar={handleAdicionarComentario}
                onEditar={handleEditarComentario}
                onExcluir={handleExcluirComentario}
                onAdicionarDraft={draft.adicionarComentario}
                onEditarDraft={(values) =>
                  draft.editarComentario(values.comentarioId, {
                    conteudo: values.conteudo,
                    linkExterno: values.linkExterno ?? null,
                  })
                }
                onExcluirDraft={draft.removerComentario}
                isDraftMode={isNew}
                disabled={false}
              />
            </section>

            <section
              className="rounded-[var(--radius-2xl)] border p-4"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-0)",
              }}
            >
              <div className="mb-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-1)" }}
                >
                  Atualizações
                </h3>
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--text-3)" }}
                >
                  Histórico automático dos eventos do objetivo.
                </p>
              </div>

              <TarefaAtualizacoesPanel
                itens={atualizacoesSidebar}
                vazioLabel="Nenhuma atualização registrada até o momento."
              />
            </section>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {!isNew && tarefa?.tipo === "pai" ? (
                <>
                  {tarefa.status !== "concluida" ? (
                    (["a_fazer", "em_andamento", "atencao", "em_pausa"] as const)
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
                      ))
                  ) : (
                    (["a_fazer", "em_andamento", "atencao", "em_pausa"] as const).map(
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
                    )
                  )}

                  {onExcluir ? (
                    <button
                      type="button"
                      onClick={onExcluir}
                      className="button-danger inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                    >
                      Excluir objetivo
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
              >
                Fechar
              </button>

              <button
                type="submit"
                form="form-tarefa-pai"
                disabled={submitting}
                className="button-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Salvando..."
                  : isNew
                    ? "Salvar objetivo"
                    : "Salvar alterações"}
              </button>
            </div>
          </div>
        }
      />

      <TarefaFilhaQuickModal
        key={`${isNew ? "novo" : tarefa?.id ?? "sem-id"}-${quickFilhaOpen ? "open" : "closed"}`}
        open={quickFilhaOpen}
        onClose={() => setQuickFilhaOpen(false)}
        equipes={equipes}
        categorias={categorias}
        usuarios={usuarios}
        equipePredefinidaId={equipePredefinidaId}
        bloquearEquipe={bloquearEquipeFilha}
        onSubmit={(values) => {
          draft.adicionarFilha({
            titulo: values.titulo,
            descricao: values.descricao ?? null,
            equipeId: values.equipeId,
            categoriaId: values.categoriaId,
            prioridade: values.prioridade,
            dataEntrega: values.dataEntrega,
            horaEntrega: values.horaEntrega ?? null,
            responsavelIds: values.responsavelIds,
            status: values.status ?? "a_fazer",
          });
        }}
      />
    </>
  );
}