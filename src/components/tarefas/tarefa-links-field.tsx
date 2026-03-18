"use client";

import { Link2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type LinkItem = {
  id?: string;
  url: string;
  texto?: string | null;
};

type Props = {
  value: LinkItem[];
  onChange: (value: LinkItem[]) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
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

function formatarExibicao(item: LinkItem) {
  return item.texto?.trim() || item.url;
}

export function TarefaLinksField({
  value,
  onChange,
  disabled = false,
  label = "Links",
  description = `Adicione até ${LIMITE_LINKS} links externos relacionados.`,
}: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const atingiuLimite = value.length >= LIMITE_LINKS;
  const podeSalvar = useMemo(() => url.trim().length > 0, [url]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setErro(null);
        setEditandoIndex(null);
        setUrl("");
        setTexto("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function limparFormulario() {
    setUrl("");
    setTexto("");
    setErro(null);
    setEditandoIndex(null);
  }

  function fecharPopover() {
    setOpen(false);
    limparFormulario();
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
      fecharPopover();
      return;
    }

    if (atingiuLimite) {
      setErro(`A tarefa pode ter no máximo ${LIMITE_LINKS} links.`);
      return;
    }

    onChange([...value, novoItem]);
    fecharPopover();
  }

  function editar(index: number) {
    const item = value[index];
    setUrl(item.url);
    setTexto(item.texto ?? "");
    setErro(null);
    setEditandoIndex(index);
    setOpen(true);
  }

  function remover(index: number) {
    if (disabled) return;

    onChange(value.filter((_, currentIndex) => currentIndex !== index));

    if (editandoIndex === index) {
      limparFormulario();
    }
  }

  return (
    <div
      ref={containerRef}
      className="rounded-[24px] p-4 md:p-5"
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
            {label}
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
            {description}
          </p>
        </div>

        <div className="relative overflow-visible">
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              if (open) {
                fecharPopover();
              } else {
                setOpen(true);
                setErro(null);
              }
            }}
            disabled={disabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition"
            style={{
              backgroundColor: "var(--surface-0)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{open ? "Fechar" : "Adicionar"}</span>
          </button>

          {open ? (
            <div
              className="absolute bottom-12 right-0 z-40 mb-2 w-[min(96vw,350px)] overflow-hidden rounded-2xl"
              style={{
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <div
                className="flex items-center justify-between gap-3 px-3 py-2.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <h4
                    className="text-sm font-medium"
                    style={{ color: "var(--text-1)" }}
                  >
                    {editandoIndex !== null ? "Editar link" : "Adicionar link"}
                  </h4>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-4)" }}>
                    {value.length} de {LIMITE_LINKS} links adicionados.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharPopover}
                  className="text-xs font-medium transition"
                  style={{ color: "var(--text-4)" }}
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-2 p-3">
                <input
                  type="text"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (erro) setErro(null);
                  }}
                  placeholder="https://..."
                  disabled={disabled}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none transition"
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                />

                <input
                  type="text"
                  value={texto}
                  onChange={(event) => setTexto(event.target.value)}
                  placeholder="Texto opcional"
                  disabled={disabled}
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none transition"
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                />

                {erro ? (
                  <div className="status-danger rounded-2xl px-4 py-3 text-sm">
                    {erro}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={adicionarOuAtualizar}
                    disabled={
                      disabled ||
                      !podeSalvar ||
                      (atingiuLimite && editandoIndex === null)
                    }
                    className="button-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {editandoIndex !== null ? "Atualizar" : "Adicionar"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {value.length > 0 ? (
          value.map((item, index) => (
            <div
              key={`${item.id ?? "novo"}-${index}`}
              className="inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2"
              style={{
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
              }}
            >
              <Link2
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--text-4)" }}
              />

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="max-w-[220px] truncate text-sm hover:underline"
                style={{ color: "var(--text-2)" }}
                title={item.url}
              >
                {formatarExibicao(item)}
              </a>

              {!disabled ? (
                <>
                  <button
                    type="button"
                    onClick={() => editar(index)}
                    className="transition"
                    style={{ color: "var(--text-4)" }}
                    aria-label="Editar link"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => remover(index)}
                    className="transition"
                    style={{ color: "var(--text-4)" }}
                    aria-label="Remover link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : null}
            </div>
          ))
        ) : (
          <div
            className="rounded-2xl border border-dashed px-4 py-3 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-0)",
              color: "var(--text-4)",
            }}
          >
            Nenhum link adicionado.
          </div>
        )}
      </div>
    </div>
  );
}