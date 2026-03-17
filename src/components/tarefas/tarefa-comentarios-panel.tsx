"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { ComentarioDraft } from "@/components/tarefas/hooks/use-tarefa-pai-draft";
import type { TarefaComentario } from "@/types/tarefas/tarefas.types";

type ComentarioVisual = {
  id: string;
  conteudo: string;
  criadoEm: string;
  editado?: boolean;
  autorNome?: string | null;
  autorAvatarUrl?: string | null;
  comentarioPaiId?: string | null;
  origem: "persistido" | "draft";
};

type ThreadComentario = {
  pai: ComentarioVisual;
  respostas: ComentarioVisual[];
};

type Props = {
  comentarios: TarefaComentario[];
  comentariosDraft?: ComentarioDraft[];
  usuarioAtualId?: string | null;
  usuarioAtualNome?: string | null;
  usuarioAtualAvatarUrl?: string | null;
  podeModerar?: boolean;
  disabled?: boolean;
  isDraftMode?: boolean;
  onAdicionar?: (values: {
    conteudo: string;
    linkExterno?: string | null;
    comentarioPaiId?: string | null;
  }) => void | Promise<void>;
  onEditar?: (values: {
    comentarioId: string;
    conteudo: string;
    linkExterno?: string | null;
  }) => void | Promise<void>;
  onExcluir?: (comentarioId: string) => void | Promise<void>;
  onAdicionarDraft?: (values: {
    conteudo: string;
    linkExterno?: string | null;
    comentarioPaiId?: string | null;
  }) => void;
  onEditarDraft?: (values: {
    comentarioId: string;
    conteudo: string;
    linkExterno?: string | null;
  }) => void;
  onExcluirDraft?: (comentarioId: string) => void;
};

type FormState = {
  conteudo: string;
};

function iniciais(nome?: string | null) {
  if (!nome) return "U";

  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function formatarDataHora(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function extrairPrimeiroLink(texto: string) {
  const match = texto.match(/https?:\/\/[^\s]+/i);
  return match?.[0] ?? null;
}

function renderizarTextoComLinks(texto: string) {
  const regex = /(https?:\/\/[^\s]+)/gi;
  const partes = texto.split(regex);

  return partes.map((parte, index) => {
    const ehLink = /^https?:\/\/[^\s]+$/i.test(parte);

    if (ehLink) {
      return (
        <a
          key={`${parte}-${index}`}
          href={parte}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:underline"
          style={{ color: "var(--accent-2)" }}
        >
          {parte}
        </a>
      );
    }

    return <span key={index}>{parte}</span>;
  });
}

function mapComentarioPersistido(comentario: TarefaComentario): ComentarioVisual {
  const autorNome =
    (comentario as TarefaComentario & { autorNome?: string }).autorNome ?? "Usuário";
  const autorAvatarUrl =
    (comentario as TarefaComentario & { autorAvatarUrl?: string | null })
      .autorAvatarUrl ?? null;

  return {
    id: comentario.id,
    conteudo: comentario.conteudo,
    criadoEm: comentario.dataCriacao,
    editado: comentario.editado,
    autorNome,
    autorAvatarUrl,
    comentarioPaiId: comentario.comentarioPaiId,
    origem: "persistido",
  };
}

function mapComentarioDraft(
  comentario: ComentarioDraft,
  usuarioAtualNome?: string | null,
  usuarioAtualAvatarUrl?: string | null,
): ComentarioVisual {
  return {
    id: comentario.idLocal,
    conteudo: comentario.conteudo,
    criadoEm: comentario.criadoEm,
    comentarioPaiId: comentario.comentarioPaiId ?? null,
    autorNome: usuarioAtualNome ?? "Você",
    autorAvatarUrl: usuarioAtualAvatarUrl ?? null,
    origem: "draft",
  };
}

function montarThreadsComentarios(itens: ComentarioVisual[]) {
  const porId = new Map<string, ComentarioVisual>();
  itens.forEach((item) => porId.set(item.id, item));

  const raizDe = (item: ComentarioVisual): ComentarioVisual => {
    let atual = item;
    let guarda = 0;

    while (atual.comentarioPaiId && porId.has(atual.comentarioPaiId) && guarda < 20) {
      const pai = porId.get(atual.comentarioPaiId)!;
      atual = pai;
      guarda += 1;
    }

    return atual;
  };

  const mapaThreads = new Map<string, ThreadComentario>();

  for (const item of itens) {
    const raiz = raizDe(item);

    if (!mapaThreads.has(raiz.id)) {
      mapaThreads.set(raiz.id, {
        pai: raiz,
        respostas: [],
      });
    }

    if (item.id !== raiz.id) {
      mapaThreads.get(raiz.id)!.respostas.push(item);
    }
  }

  const threads = Array.from(mapaThreads.values());

  threads.forEach((thread) => {
    thread.respostas.sort(
      (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
    );
  });

  threads.sort(
    (a, b) => new Date(b.pai.criadoEm).getTime() - new Date(a.pai.criadoEm).getTime(),
  );

  return threads;
}

function AvatarComentario({
  nome,
  avatarUrl,
}: {
  nome?: string | null;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      <span className="relative h-8 w-8 overflow-hidden rounded-full">
        <Image
          src={avatarUrl}
          alt={nome ?? "Usuário"}
          fill
          className="object-cover"
          sizes="32px"
        />
      </span>
    );
  }

  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold"
      style={{
        backgroundColor: "var(--surface-3)",
        color: "var(--text-2)",
        border: "1px solid var(--border)",
      }}
    >
      {iniciais(nome)}
    </span>
  );
}

function AcaoComentario({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
      style={{ color: "var(--text-4)" }}
    >
      {label}
    </button>
  );
}

function BlocoComentario({
  comentario,
  onResponder,
  onEditar,
  onExcluir,
  disabled,
}: {
  comentario: ComentarioVisual;
  onResponder?: (comentario: ComentarioVisual) => void;
  onEditar?: (comentario: ComentarioVisual) => void;
  onExcluir?: (comentarioId: string, origem: "persistido" | "draft") => void;
  disabled?: boolean;
}) {
  return (
    <article className="space-y-2">
      <div className="flex items-start gap-3">
        <AvatarComentario
          nome={comentario.autorNome}
          avatarUrl={comentario.autorAvatarUrl}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-1)" }}
            >
              {comentario.autorNome ?? "Usuário"}
            </span>

            <span className="text-xs" style={{ color: "var(--text-4)" }}>
              {formatarDataHora(comentario.criadoEm)}
            </span>

            {comentario.origem === "draft" ? (
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  backgroundColor: "var(--surface-2)",
                  color: "var(--text-3)",
                  border: "1px solid var(--border)",
                }}
              >
                Rascunho
              </span>
            ) : null}

            {comentario.editado ? (
              <span className="text-[11px]" style={{ color: "var(--text-4)" }}>
                editado
              </span>
            ) : null}
          </div>

          <div
            className="mt-1 whitespace-pre-wrap text-sm leading-6"
            style={{ color: "var(--text-2)" }}
          >
            {renderizarTextoComLinks(comentario.conteudo)}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <AcaoComentario
              label="Responder"
              onClick={() => onResponder?.(comentario)}
              disabled={disabled}
            />
            <AcaoComentario
              label="Editar"
              onClick={() => onEditar?.(comentario)}
              disabled={disabled}
            />
            <AcaoComentario
              label="Excluir"
              onClick={() => onExcluir?.(comentario.id, comentario.origem)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function TarefaComentariosPanel({
  comentarios,
  comentariosDraft = [],
  usuarioAtualNome,
  usuarioAtualAvatarUrl,
  disabled = false,
  isDraftMode = false,
  onAdicionar,
  onEditar,
  onExcluir,
  onAdicionarDraft,
  onEditarDraft,
  onExcluirDraft,
}: Props) {
  void isDraftMode;

  const [form, setForm] = useState<FormState>({ conteudo: "" });
  const [replyTo, setReplyTo] = useState<ComentarioVisual | null>(null);
  const [editing, setEditing] = useState<ComentarioVisual | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const threads = useMemo(() => {
    const persistidos = comentarios.map(mapComentarioPersistido);
    const drafts = comentariosDraft.map((comentario) =>
      mapComentarioDraft(comentario, usuarioAtualNome, usuarioAtualAvatarUrl),
    );
    return montarThreadsComentarios([...drafts, ...persistidos]);
  }, [comentarios, comentariosDraft, usuarioAtualNome, usuarioAtualAvatarUrl]);

  const tituloContexto = useMemo(() => {
    if (editing) return "Editando comentário";
    if (replyTo) return `Respondendo ${replyTo.autorNome ?? "usuário"}`;
    return "Novo comentário";
  }, [editing, replyTo]);

  function resetForm() {
    setForm({ conteudo: "" });
    setReplyTo(null);
    setEditing(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.conteudo.trim() || disabled) return;

    setSubmitting(true);

    try {
      const linkDetectado = extrairPrimeiroLink(form.conteudo.trim());

      if (editing?.origem === "draft") {
        onEditarDraft?.({
          comentarioId: editing.id,
          conteudo: form.conteudo.trim(),
          linkExterno: linkDetectado,
        });
      } else if (editing) {
        await onEditar?.({
          comentarioId: editing.id,
          conteudo: form.conteudo.trim(),
          linkExterno: linkDetectado,
        });
      } else if (replyTo && onAdicionarDraft) {
        onAdicionarDraft({
          conteudo: form.conteudo.trim(),
          linkExterno: linkDetectado,
          comentarioPaiId: replyTo.comentarioPaiId ?? replyTo.id,
        });
      } else if (replyTo) {
        await onAdicionar?.({
          conteudo: form.conteudo.trim(),
          linkExterno: linkDetectado,
          comentarioPaiId: replyTo.comentarioPaiId ?? replyTo.id,
        });
      } else if (onAdicionarDraft) {
        onAdicionarDraft({
          conteudo: form.conteudo.trim(),
          linkExterno: linkDetectado,
          comentarioPaiId: null,
        });
      } else {
        await onAdicionar?.({
          conteudo: form.conteudo.trim(),
          linkExterno: linkDetectado,
          comentarioPaiId: null,
        });
      }

      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  function handleExcluir(id: string, origem: "persistido" | "draft") {
    if (origem === "draft") {
      onExcluirDraft?.(id);
      return;
    }

    onExcluir?.(id);
  }

  return (
    <section className="space-y-4">
      <div className="space-y-4">
        {threads.length === 0 ? (
          <div className="text-sm" style={{ color: "var(--text-4)" }}>
            Ainda não há comentários neste item.
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.pai.id} className="space-y-3">
              <BlocoComentario
                comentario={thread.pai}
                disabled={disabled || submitting}
                onResponder={(item) => {
                  setReplyTo(item);
                  setEditing(null);
                  setForm({ conteudo: "" });
                }}
                onEditar={(item) => {
                  setEditing(item);
                  setReplyTo(null);
                  setForm({ conteudo: item.conteudo });
                }}
                onExcluir={handleExcluir}
              />

              {thread.respostas.length > 0 ? (
                <div
                  className="space-y-3 border-l pl-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  {thread.respostas.map((resposta) => (
                    <BlocoComentario
                      key={resposta.id}
                      comentario={resposta}
                      disabled={disabled || submitting}
                      onResponder={(item) => {
                        setReplyTo(item);
                        setEditing(null);
                        setForm({ conteudo: "" });
                      }}
                      onEditar={(item) => {
                        setEditing(item);
                        setReplyTo(null);
                        setForm({ conteudo: item.conteudo });
                      }}
                      onExcluir={handleExcluir}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-2xl p-3"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-0)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h4
            className="text-sm font-medium"
            style={{ color: "var(--text-2)" }}
          >
            {tituloContexto}
          </h4>

          {replyTo || editing ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium transition"
              style={{ color: "var(--text-4)" }}
            >
              Cancelar
            </button>
          ) : null}
        </div>

        <textarea
          value={form.conteudo}
          onChange={(event) =>
            setForm((current) => ({ ...current, conteudo: event.target.value }))
          }
          rows={2}
          disabled={disabled || submitting}
          placeholder="Escreva um comentário"
          className="w-full rounded-2xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--input)",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
          }}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled || submitting || !form.conteudo.trim()}
            className="button-primary rounded-xl px-4 py-2 text-sm"
          >
            {editing ? "Salvar" : replyTo ? "Responder" : "Comentar"}
          </button>
        </div>
      </form>
    </section>
  );
}