"use client";

import { useMemo, useState } from "react";

type LinkItem = {
  id?: string;
  url: string;
  texto?: string | null;
};

type Props = {
  value: LinkItem[];
  onChange: (value: LinkItem[]) => void;
  disabled?: boolean;
};

const LIMITE_LINKS = 5;

function normalizarUrl(valor: string) {
  const trimmed = valor.trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidUrl(valor: string) {
  try {
    const url = new URL(valor);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const host = url.hostname.trim().toLowerCase();

    if (!host) return false;
    if (!host.includes(".")) return false;
    if (host.startsWith(".") || host.endsWith(".")) return false;

    return true;
  } catch {
    return false;
  }
}

export function TarefaLinksField({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [url, setUrl] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);

  const atingiuLimite = value.length >= LIMITE_LINKS;
  const podeSalvar = useMemo(() => url.trim().length > 0, [url]);

  function limparFormulario() {
    setUrl("");
    setTexto("");
    setErro(null);
    setEditandoIndex(null);
  }

  function adicionarOuAtualizar() {
    if (disabled) return;

    const urlNormalizada = normalizarUrl(url);
    const textoNormalizado = texto.trim() || null;

    if (!url.trim()) {
      setErro("Informe uma URL.");
      return;
    }

    if (!isValidUrl(urlNormalizada)) {
      setErro("Informe uma URL válida, como google.com ou https://google.com.");
      return;
    }

    const novoItem: LinkItem = {
      ...(editandoIndex !== null && value[editandoIndex]?.id
        ? { id: value[editandoIndex]?.id }
        : {}),
      url: urlNormalizada,
      texto: textoNormalizado,
    };

    if (editandoIndex !== null) {
      const proximo = value.map((item, index) =>
        index === editandoIndex ? novoItem : item,
      );
      onChange(proximo);
      limparFormulario();
      return;
    }

    if (atingiuLimite) {
      setErro(`A tarefa pode ter no máximo ${LIMITE_LINKS} links.`);
      return;
    }

    onChange([...value, novoItem]);
    limparFormulario();
  }

  function editar(index: number) {
    const item = value[index];
    setUrl(item.url);
    setTexto(item.texto ?? "");
    setErro(null);
    setEditandoIndex(index);
  }

  function remover(index: number) {
    if (disabled) return;
    onChange(value.filter((_, currentIndex) => currentIndex !== index));

    if (editandoIndex === index) {
      limparFormulario();
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Links</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Adicione até {LIMITE_LINKS} links externos relacionados à tarefa.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
        <input
          type="text"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            if (erro) setErro(null);
          }}
          placeholder="https://..."
          disabled={disabled}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700 disabled:opacity-50"
        />

        <input
          type="text"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Texto opcional"
          disabled={disabled}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={adicionarOuAtualizar}
          disabled={
            disabled || !podeSalvar || (atingiuLimite && editandoIndex === null)
          }
          className="rounded-xl border border-zinc-700 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {editandoIndex !== null ? "Atualizar" : "Adicionar"}
        </button>
      </div>

      {erro ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {erro}
        </div>
      ) : null}

      {value.length ? (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={`${item.id ?? "novo"}-${index}`}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-100">{item.url}</p>
                {item.texto ? (
                  <p className="mt-1 text-xs text-zinc-500">{item.texto}</p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => editar(index)}
                  disabled={disabled}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 disabled:opacity-50"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => remover(index)}
                  disabled={disabled}
                  className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-950/60 disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-3 text-sm text-zinc-500">
          Nenhum link adicionado.
        </div>
      )}
    </div>
  );
}