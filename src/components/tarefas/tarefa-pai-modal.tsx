"use client";

import { useMemo, useState } from "react";

import { TarefaAtualizacoesPanel } from "@/components/tarefas/tarefa-atualizacoes-panel";
import { TarefaChecklistFilhas, type ItemLista } from "@/components/tarefas/tarefa-checklist-filhas";
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
import type { TarefaFilhaDraft } from "@/components/tarefas/hooks/use-tarefa-pai-draft";

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

type PayloadFilha = Omit<TarefaFilhaDraft, "idLocal" | "status"> & {
  status?: TarefaFilhaDraft["status"];
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
  onExcluir?: () => void | Promise<void>;
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
  onCarregarFilhaPersistida?: (filhaId: string) => Promise<Partial<TarefaFilhaDraft> | null>;
  onSalvarFilhaPersistida?: (filhaId: string, values: PayloadFilha) => void | Promise<void>;
  onSubmit?: (
    values: PayloadObjetivo,
    extras?: {
      filhasDraft: ReturnType<typeof useTarefaPaiDraft>["filhas"];
      comentariosDraft: ReturnType<typeof useTarefaPaiDraft>["comentarios"];
    },
  ) => void | Promise<void>;
};

type PainelLateral = "filhas" | "comentarios" | "atualizacoes";

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

function AccordionSection({
  id,
  titulo,
  contador,
  aberto,
  onOpen,
  action,
  children,
}: {
  id: PainelLateral;
  titulo: string;
  contador: number;
  aberto: boolean;
  onOpen: (id: PainelLateral) => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-[var(--radius-2xl)] border"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface-0)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        onClick={() => onOpen(id)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(id);
          }
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h3
            className="truncate text-sm font-semibold"
            style={{ color: "var(--text-1)" }}
          >
            {titulo}
          </h3>
          <span className="badge-neutral inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-medium">
            {contador}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {action}
          <span className="text-xs" style={{ color: "var(--text-4)" }}>
            {aberto ? "▴" : "▾"}
          </span>
        </div>
      </div>

      {aberto ? (
        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      ) : null}
    </section>
  );
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
  onExcluir,
  onAdicionarComentario,
  onEditarComentario,
  onExcluirComentario,
  onCarregarFilhaPersistida,
  onSalvarFilhaPersistida,
  onSubmit,
}: Props) {
  const draft = useTarefaPaiDraft();
  const [quickFilhaOpen, setQuickFilhaOpen] = useState(false);
  const [painelAberto, setPainelAberto] = useState<PainelLateral>("filhas");
  const [tituloEmEdicao, setTituloEmEdicao] = useState("");
  const [formDirty, setFormDirty] = useState(false);
  const [filhaDraftEmEdicao, setFilhaDraftEmEdicao] = useState<
    (TarefaFilhaDraft & { origem: "draft"; id: string }) | null
  >(null);
  const [filhaPersistidaIdEmEdicao, setFilhaPersistidaIdEmEdicao] = useState<string | null>(null);

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

  const tituloCabecalho = useMemo(() => {
    if (tituloEmEdicao.trim()) return tituloEmEdicao.trim();
    if (isNew) return "Novo objetivo";
    return tarefa?.titulo?.trim() || "Objetivo";
  }, [isNew, tarefa, tituloEmEdicao]);

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

  const filhasSidebar: ItemLista[] = isNew
    ? draft.filhas.map((filha) => ({
        ...filha,
        id: filha.idLocal,
        origem: "draft" as const,
      }))
    : (tarefa?.filhas ?? []).map((filha) => ({
        ...filha,
        origem: "persistida" as const,
      }));

  const comentariosPersistidos = tarefa?.comentarios ?? [];
  const comentariosSidebarCount = isNew
    ? draft.comentarios.length
    : comentariosPersistidos.length;

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
      setFormDirty(false);
      setTituloEmEdicao("");
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

  function handleClose() {
    const houveMudancaDraft =
      draft.filhas.length > 0 ||
      draft.comentarios.length > 0 ||
      draft.atualizacoes.length > 1;

    if ((isNew && houveMudancaDraft) || formDirty) {
      const confirmar = window.confirm(
        "Tem certeza que deseja sair sem salvar?",
      );
      if (!confirmar) return;
    }

    onClose();
  }

  function abrirNovaFilha() {
    setFilhaDraftEmEdicao(null);
    setFilhaPersistidaIdEmEdicao(null);
    setQuickFilhaOpen(true);
  }

  async function abrirFilha(item: ItemLista) {
    if (item.origem === "draft") {
      setFilhaDraftEmEdicao(item);
      setFilhaPersistidaIdEmEdicao(null);
      setQuickFilhaOpen(true);
      return;
    }

    if (!onCarregarFilhaPersistida) {
      return;
    }

    const payload = await onCarregarFilhaPersistida(item.id);

    if (!payload) {
      return;
    }

    setFilhaDraftEmEdicao({
      id: item.id,
      idLocal: item.id,
      origem: "draft",
      titulo: payload.titulo ?? item.titulo,
      descricao: payload.descricao ?? null,
      equipeId: payload.equipeId ?? "",
      categoriaId: payload.categoriaId ?? "",
      prioridade: payload.prioridade ?? "media",
      dataEntrega: payload.dataEntrega ?? item.dataEntrega,
      horaEntrega: payload.horaEntrega ?? item.horaEntrega ?? null,
      responsavelIds: payload.responsavelIds ?? [],
      status: payload.status ?? item.status,
    });

    setFilhaPersistidaIdEmEdicao(item.id);
    setQuickFilhaOpen(true);
  }

  async function handleSubmitFilha(values: PayloadFilha) {
    if (filhaPersistidaIdEmEdicao && onSalvarFilhaPersistida) {
      await onSalvarFilhaPersistida(filhaPersistidaIdEmEdicao, values);
      return;
    }

    if (!filhaDraftEmEdicao) {
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
      return;
    }

    draft.editarFilha(filhaDraftEmEdicao.idLocal, {
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
        onClose={handleClose}
        main={
          <div className="space-y-5">
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
                submitLabel=""
                formId="form-tarefa-pai"
                hideInternalSubmit
                hideProjetoWhenEscopoEquipe
                onTituloChange={setTituloEmEdicao}
                onDirtyChange={setFormDirty}
              />
            </div>
          </div>
        }
        sidebar={
          <div className="space-y-4">
            <AccordionSection
              id="filhas"
              titulo="Tarefas filhas"
              contador={filhasSidebar.length}
              aberto={painelAberto === "filhas"}
              onOpen={setPainelAberto}
              action={
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    abrirNovaFilha();
                  }}
                  className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-medium transition"
                  style={{
                    color: "var(--text-3)",
                    backgroundColor: "var(--surface-1)",
                    border: "1px solid var(--border)",
                  }}
                >
                  + Adicionar
                </button>
              }
            >
              <TarefaChecklistFilhas
                titulo="Checklist das filhas"
                itens={filhasSidebar}
                onAbrirItem={abrirFilha}
                onRemoverDraft={draft.removerFilha}
              />
            </AccordionSection>

            <AccordionSection
              id="comentarios"
              titulo="Comentários"
              contador={comentariosSidebarCount}
              aberto={painelAberto === "comentarios"}
              onOpen={setPainelAberto}
            >
              <TarefaComentariosPanel
                comentarios={comentariosPersistidos}
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
            </AccordionSection>

            <AccordionSection
              id="atualizacoes"
              titulo="Atualizações"
              contador={atualizacoesSidebar.length}
              aberto={painelAberto === "atualizacoes"}
              onOpen={setPainelAberto}
            >
              <TarefaAtualizacoesPanel
                itens={atualizacoesSidebar}
                vazioLabel="Nenhuma atualização registrada até o momento."
              />
            </AccordionSection>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {!isNew && tarefa?.tipo === "pai" && tarefa.status === "concluida" ? (
                <button
                  type="button"
                  onClick={() => onReabrir?.("a_fazer")}
                  className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                >
                  Reabrir objetivo
                </button>
              ) : null}

              {!isNew && onExcluir ? (
                <button
                  type="button"
                  onClick={onExcluir}
                  className="button-danger inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                >
                  Excluir objetivo
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
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
        key={`${isNew ? "novo" : tarefa?.id ?? "sem-id"}-${quickFilhaOpen ? "open" : "closed"}-${filhaPersistidaIdEmEdicao ?? filhaDraftEmEdicao?.idLocal ?? "new"}`}
        open={quickFilhaOpen}
        onClose={() => {
          setQuickFilhaOpen(false);
          setFilhaDraftEmEdicao(null);
          setFilhaPersistidaIdEmEdicao(null);
        }}
        equipes={equipes}
        categorias={categorias}
        usuarios={usuarios}
        equipePredefinidaId={equipePredefinidaId}
        bloquearEquipe={bloquearEquipeFilha}
        initialValues={
          filhaDraftEmEdicao
            ? {
                titulo: filhaDraftEmEdicao.titulo,
                descricao: filhaDraftEmEdicao.descricao ?? null,
                equipeId: filhaDraftEmEdicao.equipeId,
                categoriaId: filhaDraftEmEdicao.categoriaId,
                prioridade: filhaDraftEmEdicao.prioridade,
                dataEntrega: filhaDraftEmEdicao.dataEntrega,
                horaEntrega: filhaDraftEmEdicao.horaEntrega ?? null,
                responsavelIds: filhaDraftEmEdicao.responsavelIds,
                status: filhaDraftEmEdicao.status,
              }
            : undefined
        }
        onSubmit={handleSubmitFilha}
      />
    </>
  );
}
