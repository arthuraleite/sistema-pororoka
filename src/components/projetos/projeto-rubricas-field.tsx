"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

import type {
  ProjetoRubricaFormItem,
  RubricaGlobalProjetoOption,
} from "@/types/projetos/projetos.types";

type Props = {
  value: ProjetoRubricaFormItem[];
  onChange: (value: ProjetoRubricaFormItem[]) => void;
  rubricasGlobais: RubricaGlobalProjetoOption[];
  orcamentoTotal: number | null;
  disabled?: boolean;
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(valor);
}

export function ProjetoRubricasField({
  value,
  onChange,
  rubricasGlobais,
  orcamentoTotal,
  disabled = false,
}: Props) {
  const somaRubricas = useMemo(
    () =>
      value.reduce((acc, item) => acc + (item.limite_teto_gasto ?? 0), 0),
    [value],
  );

  const rubricasDisponiveis = useMemo(
    () =>
      rubricasGlobais.filter(
        (rubrica) =>
          !value.some((item) => item.rubrica_global_id === rubrica.id),
      ),
    [rubricasGlobais, value],
  );

  function adicionar() {
    if (disabled || rubricasDisponiveis.length === 0) return;

    onChange([
      ...value,
      {
        rubrica_global_id: rubricasDisponiveis[0].id,
        limite_teto_gasto: null,
      },
    ]);
  }

  function atualizarRubrica(index: number, rubricaGlobalId: string) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              rubrica_global_id: rubricaGlobalId,
            }
          : item,
      ),
    );
  }

  function atualizarValor(index: number, texto: string) {
    const normalizado = texto.replace(",", ".");
    const numero = Number(normalizado);

    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              limite_teto_gasto: Number.isFinite(numero) ? numero : null,
            }
          : item,
      ),
    );
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
            Rubricas
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
            Para projetos financiados, a soma dos tetos deve ser exatamente igual ao orçamento total.
          </p>
        </div>

        <button
          type="button"
          onClick={adicionar}
          disabled={disabled || rubricasDisponiveis.length === 0}
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
            Nenhuma rubrica adicionada.
          </div>
        ) : (
          value.map((item, index) => {
            const opcoes = [
              ...rubricasDisponiveis.filter(
                (rubrica) => rubrica.id !== item.rubrica_global_id,
              ),
              ...rubricasGlobais.filter(
                (rubrica) => rubrica.id === item.rubrica_global_id,
              ),
            ].sort((a, b) => a.nome.localeCompare(b.nome));

            return (
              <div
                key={`${item.rubrica_global_id}_${index}`}
                className="grid gap-3 rounded-2xl p-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
                style={{
                  backgroundColor: "var(--surface-0)",
                  border: "1px solid var(--border)",
                }}
              >
                <select
                  value={item.rubrica_global_id}
                  onChange={(event) =>
                    atualizarRubrica(index, event.target.value)
                  }
                  disabled={disabled}
                  className="h-11 rounded-2xl px-4 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                >
                  {opcoes.map((rubrica) => (
                    <option key={rubrica.id} value={rubrica.id}>
                      {rubrica.nome}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.limite_teto_gasto ?? ""}
                  onChange={(event) =>
                    atualizarValor(index, event.target.value)
                  }
                  disabled={disabled}
                  placeholder="Teto da rubrica"
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
                  aria-label={`Remover rubrica ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div
        className="mt-4 grid gap-3 rounded-2xl p-4 md:grid-cols-2"
        style={{
          backgroundColor: "var(--surface-0)",
          border: "1px solid var(--border)",
        }}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
            Soma das rubricas
          </p>
          <p className="mt-2 text-lg font-semibold" style={{ color: "var(--text-1)" }}>
            {formatarMoeda(somaRubricas)}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
            Orçamento total
          </p>
          <p className="mt-2 text-lg font-semibold" style={{ color: "var(--text-1)" }}>
            {orcamentoTotal !== null ? formatarMoeda(orcamentoTotal) : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}