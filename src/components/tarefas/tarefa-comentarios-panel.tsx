"use client";

import { useMemo, useState } from "react";

import type { TarefaComentario, UsuarioResumoTarefa } from "@/types/tarefas/tarefas.types";

type Props = {
  comentarios: TarefaComentario[];
  usuarioAtualId?: string | null;
  podeModerar?: boolean;
  disabled?: boolean;
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
};

type FormState = {
  conteudo: string;
  linkExterno: string;
};

function iniciais(nome?: string | null) {
  if (!nome) return "??";

  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function autorNome(autor?: UsuarioResumoTarefa | null) {
  return autor?.nome ?? "Usuário";
}

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function ComentarioItem({
  comentario,
  nivel = 0,
  usuarioAtualId,
  podeModerar = false,
  disabled = false,
  onResponder,
  onEditar,
  onExcluir,
}: {
  comentario: TarefaComentario;
  nivel?: number;
  usuarioAtualId?: string | null;
  podeModerar?: boolean;
  disabled?: boolean;
  onResponder?: (comentario: TarefaComentario) => void;
  onEditar?: (comentario: TarefaComentario) => void;
  onExcluir?: (comentarioId: string) => void;
}) {
  const podeEditar = comentario.autorId === usuarioAtualId;
  const podeExcluir = podeEditar || podeModerar;

  return (
    <div
      className={[
        "space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4",
        nivel > 0 ? "ml-4 border-zinc-800/80" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-xs font-semibold text-zinc-200">
          {comentario.autor?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comentario.autor.avatarUrl}
              alt={autorNome(comentario.autor)}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            iniciais(comentario.autor?.nome)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">
              {autorNome(comentario.autor)}
            </span>
            <span className="text-xs text-zinc-500">
              {formatarDataHora(comentario.dataCriacao)}
            </span>
            {comentario.editado ? (
              <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
                editado
              </span>
            ) : null}
          </div>

          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
            {comentario.conteudo}
          </div>

          {comentario.linkExterno ? (
            <a
              href={comentario.linkExterno}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs text-sky-400 underline-offset-2 hover:underline"
            >
              {comentario.linkExterno}
            </a>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onResponder?.(comentario)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 disabled:opacity-50"
            >
              Responder
            </button>

            {podeEditar ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onEditar?.(comentario)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 disabled:opacity-50"
              >
                Editar
              </button>
            ) : null}

            {podeExcluir ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onExcluir?.(comentario.id)}
                className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-950/60 disabled:opacity-50"
              >
                Excluir
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {comentario.respostas?.length ? (
        <div className="space-y-3">
          {comentario.respostas.map((resposta) => (
            <ComentarioItem
              key={resposta.id}
              comentario={resposta}
              nivel={nivel + 1}
              usuarioAtualId={usuarioAtualId}
              podeModerar={podeModerar}
              disabled={disabled}
              onResponder={onResponder}
              onEditar={onEditar}
              onExcluir={onExcluir}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TarefaComentariosPanel({
  comentarios,
  usuarioAtualId,
  podeModerar = false,
  disabled = false,
  onAdicionar,
  onEditar,
  onExcluir,
}: Props) {
  const [form, setForm] = useState<FormState>({
    conteudo: "",
    linkExterno: "",
  });
  const [replyTo, setReplyTo] = useState<TarefaComentario | null>(null);
  const [editing, setEditing] = useState<TarefaComentario | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tituloContexto = useMemo(() => {
    if (editing) return "Editando comentário";
    if (replyTo) return `Respondendo ${autorNome(replyTo.autor)}`;
    return "Novo comentário";
  }, [editing, replyTo]);

  function resetForm() {
    setForm({
      conteudo: "",
      linkExterno: "",
    });
    setReplyTo(null);
    setEditing(null);
  }

  function iniciarResposta(comentario: TarefaComentario) {
    setReplyTo(comentario);
    setEditing(null);
    setForm({
      conteudo: "",
      linkExterno: "",
    });
  }

  function iniciarEdicao(comentario: TarefaComentario) {
    setEditing(comentario);
    setReplyTo(null);
    setForm({
      conteudo: comentario.conteudo,
      linkExterno: comentario.linkExterno ?? "",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) return;
    if (!form.conteudo.trim()) return;

    setSubmitting(true);

    try {
      if (editing) {
        await onEditar?.({
          comentarioId: editing.id,
          conteudo: form.conteudo.trim(),
          linkExterno: form.linkExterno.trim() || null,
        });
      } else {
        await onAdicionar?.({
          conteudo: form.conteudo.trim(),
          linkExterno: form.linkExterno.trim() || null,
          comentarioPaiId: replyTo?.id ?? null,
        });
      }

      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div>
        <h3 className="text-base font-semibold text-zinc-100">Comentários</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Conversa interna da tarefa, com respostas em hierarquia simples.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-zinc-200">{tituloContexto}</h4>

          {(replyTo || editing) ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700"
            >
              Cancelar
            </button>
          ) : null}
        </div>

        {replyTo ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-xs text-zinc-400">
            Respondendo comentário de <span className="font-medium text-zinc-200">{autorNome(replyTo.autor)}</span>
          </div>
        ) : null}

        <textarea
          value={form.conteudo}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              conteudo: event.target.value,
            }))
          }
          disabled={disabled || submitting}
          rows={4}
          placeholder="Escreva um comentário"
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700 disabled:opacity-60"
        />

        <input
          type="url"
          value={form.linkExterno}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              linkExterno: event.target.value,
            }))
          }
          disabled={disabled || submitting}
          placeholder="Link externo opcional"
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700 disabled:opacity-60"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={disabled || submitting || !form.conteudo.trim()}
            className="rounded-2xl border border-zinc-700 bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {submitting
              ? "Salvando..."
              : editing
                ? "Salvar comentário"
                : replyTo
                  ? "Responder"
                  : "Adicionar comentário"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {comentarios.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-500">
            Ainda não há comentários nesta tarefa.
          </div>
        ) : null}

        {comentarios.map((comentario) => (
          <ComentarioItem
            key={comentario.id}
            comentario={comentario}
            usuarioAtualId={usuarioAtualId}
            podeModerar={podeModerar}
            disabled={disabled}
            onResponder={iniciarResposta}
            onEditar={iniciarEdicao}
            onExcluir={(comentarioId) => onExcluir?.(comentarioId)}
          />
        ))}
      </div>
    </section>
  );
}