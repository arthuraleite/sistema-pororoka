"use client";

import { useMemo, useState } from "react";

import { TarefaAtualizacoesPanel } from "@/components/tarefas/tarefa-atualizacoes-panel";
import { TarefaComentariosPanel } from "@/components/tarefas/tarefa-comentarios-panel";
import { TarefaFormBase } from "@/components/tarefas/tarefa-form-base";
import { TarefaModalShell } from "@/components/tarefas/tarefa-modal-shell";
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

type PainelLateral = "comentarios" | "atualizacoes";

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

function tituloBase(tipo: Props["tipo"]) {
  return tipo === "filha" ? "Tarefa filha" : "Tarefa órfã";
}

function subtituloModal(mode: Props["mode"], tipo: Props["tipo"]) {
  if (mode === "create") {
    return `Cadastre uma nova ${tituloBase(tipo).toLowerCase()} e organize responsáveis, prazo e comentários no mesmo fluxo.`;
  }

  return `Edite a ${tituloBase(tipo).toLowerCase()} diretamente, com comentários e atualizações no mesmo fluxo.`;
}

function AccordionSection({
  id,
  titulo,
  contador,
  aberto,
  onOpen,
  children,
}: {
  id: PainelLateral;
  titulo: string;
  contador: number;
  aberto: boolean;
  onOpen: (id: PainelLateral) => void;
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

        <span className="text-xs" style={{ color: "var(--text-4)" }}>
          {aberto ? "▴" : "▾"}
        </span>
      </div>

      {aberto ? (
        <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      ) : null}
    </section>
  );
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
  onExcluir,
  onReabrir,
  onAtualizarStatus,
  onSubmit,
  onAdicionarComentario,
  onEditarComentario,
  onExcluirComentario,
}: Props) {
  const [tituloEmEdicao, setTituloEmEdicao] = useState("");
  const [formDirty, setFormDirty] = useState(false);
  const [painelAberto, setPainelAberto] = useState<PainelLateral>("comentarios");

  const effectiveMode = mode === "create" ? "create" : "edit";

  const tituloCabecalho = useMemo(() => {
    if (tituloEmEdicao.trim()) return tituloEmEdicao.trim();

    if (mode === "create") {
      return `Nova ${tituloBase(tipo).toLowerCase()}`;
    }

    return tarefa?.titulo?.trim() || tituloBase(tipo);
  }, [mode, tipo, tarefa, tituloEmEdicao]);

  const subtituloCabecalho = useMemo(
    () => subtituloModal(mode, tipo),
    [mode, tipo],
  );

  const atualizacoesSidebar = useMemo(() => {
    if (!tarefa) return [];

    const itens: Array<{ id: string; descricao: string; criadoEm: string }> = [];

    if (tarefa.dataCriacao) {
      itens.push({
        id: `criacao_${tarefa.id}`,
        descricao: "Tarefa criada.",
        criadoEm: tarefa.dataCriacao,
      });
    }

    if (tarefa.dataAtualizacao && tarefa.dataAtualizacao !== tarefa.dataCriacao) {
      itens.push({
        id: `edicao_${tarefa.id}`,
        descricao: "Tarefa atualizada.",
        criadoEm: tarefa.dataAtualizacao,
      });
    }

    for (const comentario of tarefa.comentarios ?? []) {
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
  }, [tarefa]);

  function handleClose() {
    if (effectiveMode !== "create" || mode === "create") {
      if (formDirty) {
        const confirmar = window.confirm(
          "Tem certeza que deseja sair sem salvar?",
        );
        if (!confirmar) return;
      }
    }

    onClose();
  }

  if (!open) return null;

  return (
    <TarefaModalShell
      open={open}
      title={tituloCabecalho}
      subtitle={subtituloCabecalho}
      onClose={handleClose}
      main={
        <div className="space-y-5">
          <div className="mx-auto w-full max-w-[1120px]">
            <TarefaFormBase
              mode={effectiveMode}
              tipo={tipo}
              usuarios={usuarios}
              equipes={equipes}
              categorias={categorias}
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
                      responsavelIds: tarefa.responsaveis.map((item) => item.id),
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
              submitLabel=""
              formId="form-tarefa-operacional"
              hideInternalSubmit
              onTituloChange={setTituloEmEdicao}
              onDirtyChange={setFormDirty}
              lockEquipeSelection={mode !== "create"}
              lockTarefaPaiSelection={mode !== "create" && tipo === "filha"}
            />
          </div>
        </div>
      }
      sidebar={
        <div className="space-y-4">
          <AccordionSection
            id="comentarios"
            titulo="Comentários"
            contador={tarefa?.comentarios.length ?? 0}
            aberto={painelAberto === "comentarios"}
            onOpen={setPainelAberto}
          >
            {tarefa ? (
              <TarefaComentariosPanel
                comentarios={tarefa.comentarios}
                usuarioAtualId={usuarioAtualId}
                usuarioAtualNome={
                  usuarios.find((usuario) => usuario.id === usuarioAtualId)?.nome ??
                  null
                }
                usuarioAtualAvatarUrl={
                  usuarios.find((usuario) => usuario.id === usuarioAtualId)
                    ?.avatarUrl ?? null
                }
                podeModerar={podeModerarComentarios}
                onAdicionar={onAdicionarComentario}
                onEditar={onEditarComentario}
                onExcluir={onExcluirComentario}
                disabled={mode === "create"}
              />
            ) : (
              <div
                className="rounded-2xl p-4 text-sm"
                style={{
                  border: "1px dashed var(--border)",
                  backgroundColor: "var(--surface-0)",
                  color: "var(--text-3)",
                }}
              >
                Salve a tarefa antes de começar a comentar.
              </div>
            )}
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
            {tarefa && mode !== "create" ? (
              <>
                {tarefa.status !== "concluida" ? (
                  <button
                    type="button"
                    onClick={() => onAtualizarStatus?.("concluida")}
                    className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                  >
                    Concluir tarefa
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReabrir?.("a_fazer")}
                    className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                  >
                    Reabrir tarefa
                  </button>
                )}

                {onExcluir ? (
                  <button
                    type="button"
                    onClick={onExcluir}
                    className="button-danger inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
                  >
                    Excluir tarefa
                  </button>
                ) : null}
              </>
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
              form="form-tarefa-operacional"
              className="button-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
            >
              {mode === "create" ? "Criar tarefa" : "Salvar alterações"}
            </button>
          </div>
        </div>
      }
    />
  );
}
