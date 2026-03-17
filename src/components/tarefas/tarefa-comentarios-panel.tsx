"use client";

import { useMemo, useState } from "react";

import type { TarefaComentario } from "@/types/tarefas/tarefas.types";
import type { ComentarioDraft } from "@/components/tarefas/hooks/use-tarefa-pai-draft";

type ComentarioVisual = {
  id: string;
  conteudo: string;
  linkExterno?: string | null;
  criadoEm: string;
  editado?: boolean;
  autorNome?: string | null;
  autorAvatarUrl?: string | null;
  comentarioPaiId?: string | null;
  respostas?: ComentarioVisual[];
  origem: "persistido" | "draft";
};

type Props = {
  comentarios: TarefaComentario[];
  comentariosDraft?: ComentarioDraft[];
  usuarioAtualId?: string | null;
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
  linkExterno: string;
};

function formatarDataHora(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function mapComentarioPersistido(comentario: TarefaComentario): ComentarioVisual {
  const autorNome = (comentario as TarefaComentario & { autorNome?: string }).autorNome ?? "Usuário";
  const autorAvatarUrl = (comentario as TarefaComentario & { autorAvatarUrl?: string | null }).autorAvatarUrl ?? null;

  return {
    id: comentario.id,
    conteudo: comentario.conteudo,
    linkExterno: comentario.linkExterno,
    criadoEm: comentario.dataCriacao,
    editado: comentario.editado,
    autorNome,
    autorAvatarUrl,
    comentarioPaiId: comentario.comentarioPaiId,
    respostas: comentario.respostas?.map(mapComentarioPersistido) ?? [],
    origem: "persistido",
  };
}

function mapComentarioDraft(comentario: ComentarioDraft): ComentarioVisual {
  return {
    id: comentario.idLocal,
    conteudo: comentario.conteudo,
    linkExterno: comentario.linkExterno ?? null,
    criadoEm: comentario.criadoEm,
    comentarioPaiId: comentario.comentarioPaiId ?? null,
    autorNome: "Rascunho local",
    origem: "draft",
    respostas: [],
  };
}

function ComentarioItem({
  comentario,
  onResponder,
  onEditar,
  onExcluir,
  disabled,
}: {
  comentario: ComentarioVisual;
  onResponder?: (comentario: ComentarioVisual) => void;
  onEditar?: (comentario: ComentarioVisual) => void;
  onExcluir?: (comentarioId: string) => void;
  disabled?: boolean;
}) {
  return (
    <article
      className="rounded-2xl p-4"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface-0)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-1)]">{comentario.autorNome ?? "Usuário"}</span>
            <span className="text-xs text-[var(--text-4)]">{formatarDataHora(comentario.criadoEm)}</span>
            {comentario.origem === "draft" ? <span className="badge-neutral rounded-full px-2 py-0.5 text-[11px]">Rascunho</span> : null}
            {comentario.editado ? <span className="badge-neutral rounded-full px-2 py-0.5 text-[11px]">Editado</span> : null}
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-2)]">{comentario.conteudo}</div>
          {comentario.linkExterno ? (
            <a href={comentario.linkExterno} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-[var(--accent-2)] underline-offset-2 hover:underline">
              {comentario.linkExterno}
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={disabled} onClick={() => onResponder?.(comentario)} className="button-neutral rounded-xl px-3 py-2 text-xs">Responder</button>
        <button type="button" disabled={disabled} onClick={() => onEditar?.(comentario)} className="button-neutral rounded-xl px-3 py-2 text-xs">Editar</button>
        <button type="button" disabled={disabled} onClick={() => onExcluir?.(comentario.id)} className="button-neutral rounded-xl px-3 py-2 text-xs">Excluir</button>
      </div>

      {comentario.respostas?.length ? (
        <div className="mt-3 space-y-3 border-l pl-4" style={{ borderColor: "var(--border)" }}>
          {comentario.respostas.map((resposta) => (
            <ComentarioItem key={resposta.id} comentario={resposta} onResponder={onResponder} onEditar={onEditar} onExcluir={onExcluir} disabled={disabled} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function TarefaComentariosPanel({
  comentarios,
  comentariosDraft = [],
  disabled = false,
  isDraftMode = false,
  onAdicionar,
  onEditar,
  onExcluir,
  onAdicionarDraft,
  onEditarDraft,
  onExcluirDraft,
}: Props) {
  const [form, setForm] = useState<FormState>({ conteudo: "", linkExterno: "" });
  const [replyTo, setReplyTo] = useState<ComentarioVisual | null>(null);
  const [editing, setEditing] = useState<ComentarioVisual | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const comentariosVisuais = useMemo(() => {
    const persistidos = comentarios.map(mapComentarioPersistido);
    const drafts = comentariosDraft.map(mapComentarioDraft);
    return [...drafts, ...persistidos];
  }, [comentarios, comentariosDraft]);

  const tituloContexto = useMemo(() => {
    if (editing) return "Editando comentário";
    if (replyTo) return `Respondendo ${replyTo.autorNome ?? "usuário"}`;
    return "Novo comentário";
  }, [editing, replyTo]);

  function resetForm() {
    setForm({ conteudo: "", linkExterno: "" });
    setReplyTo(null);
    setEditing(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.conteudo.trim() || disabled) return;

    setSubmitting(true);
    try {
      if (editing?.origem === "draft") {
        onEditarDraft?.({ comentarioId: editing.id, conteudo: form.conteudo.trim(), linkExterno: form.linkExterno.trim() || null });
      } else if (editing) {
        await onEditar?.({ comentarioId: editing.id, conteudo: form.conteudo.trim(), linkExterno: form.linkExterno.trim() || null });
      } else if (onAdicionarDraft) {
        onAdicionarDraft({ conteudo: form.conteudo.trim(), linkExterno: form.linkExterno.trim() || null, comentarioPaiId: replyTo?.id ?? null });
      } else {
        await onAdicionar?.({ conteudo: form.conteudo.trim(), linkExterno: form.linkExterno.trim() || null, comentarioPaiId: replyTo?.id ?? null });
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
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-1)]">Comentários</h3>
        <p className="mt-1 text-xs text-[var(--text-4)]">Conversa interna e registro contextual do objetivo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl p-4" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface-0)" }}>
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-[var(--text-2)]">{tituloContexto}</h4>
          {replyTo || editing ? (
            <button type="button" onClick={resetForm} className="button-neutral rounded-xl px-3 py-2 text-xs">Cancelar</button>
          ) : null}
        </div>

        <textarea
          value={form.conteudo}
          onChange={(event) => setForm((current) => ({ ...current, conteudo: event.target.value }))}
          rows={4}
          disabled={disabled || submitting}
          placeholder="Escreva um comentário"
          className="w-full rounded-2xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
        />

        <input
          type="url"
          value={form.linkExterno}
          onChange={(event) => setForm((current) => ({ ...current, linkExterno: event.target.value }))}
          disabled={disabled || submitting}
          placeholder="Link externo opcional"
          className="w-full rounded-2xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }}
        />

        <div className="flex justify-end">
          <button type="submit" disabled={disabled || submitting || !form.conteudo.trim()} className="button-primary rounded-xl px-4 py-2 text-sm">
            {editing ? "Salvar comentário" : replyTo ? "Responder" : "Adicionar comentário"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {comentariosVisuais.length === 0 ? (
          <div className="rounded-2xl p-4 text-sm" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--surface-0)", color: "var(--text-3)" }}>
            Ainda não há comentários neste item.
          </div>
        ) : null}

        {comentariosVisuais.map((comentario) => (
          <ComentarioItem
            key={comentario.id}
            comentario={comentario}
            disabled={disabled || submitting}
            onResponder={setReplyTo}
            onEditar={(item) => {
              setEditing(item);
              setReplyTo(null);
              setForm({ conteudo: item.conteudo, linkExterno: item.linkExterno ?? "" });
            }}
            onExcluir={() => handleExcluir(comentario.id, comentario.origem)}
          />
        ))}
      </div>
    </section>
  );
}
