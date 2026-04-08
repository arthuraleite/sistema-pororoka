"use client";

import { Plus, Trash2 } from "lucide-react";

import type { ProjetoLinkFormItem } from "@/types/projetos/projetos.types";

type Props = {
  value: ProjetoLinkFormItem[];
  onChange: (value: ProjetoLinkFormItem[]) => void;
  disabled?: boolean;
};

export function ProjetoLinksField({
  value,
  onChange,
  disabled = false,
}: Props) {
  function adicionar() {
    if (disabled || value.length >= 10) return;

    onChange([...value, { titulo: "", url: "" }]);
  }

  function atualizar(
    index: number,
    field: keyof ProjetoLinkFormItem,
    campoValor: string,
  ) {
    const proximo = value.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: campoValor } : item,
    );

    onChange(proximo);
  }

  function remover(index: number) {
    if (disabled) return;
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section
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
            Links
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
            Adicione até 10 links relacionados ao projeto.
          </p>
        </div>

        <button
          type="button"
          onClick={adicionar}
          disabled={disabled || value.length >= 10}
          className="button-neutral inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {value.length === 0 ? (
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
        ) : (
          value.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl p-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]"
              style={{
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
              }}
            >
              <input
                type="text"
                value={item.titulo}
                onChange={(event) =>
                  atualizar(index, "titulo", event.target.value)
                }
                disabled={disabled}
                placeholder="Título do link"
                className="h-11 rounded-2xl px-4 text-sm outline-none"
                style={{
                  backgroundColor: "var(--input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              />

              <input
                type="text"
                value={item.url}
                onChange={(event) => atualizar(index, "url", event.target.value)}
                disabled={disabled}
                placeholder="URL"
                className="h-11 rounded-2xl px-4 text-sm outline-none"
                style={{
                  backgroundColor: "var(--input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              />

              <button
                type="button"
                onClick={() => remover(index)}
                disabled={disabled}
                className="button-danger inline-flex h-11 items-center justify-center rounded-2xl px-4"
                aria-label={`Remover link ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}