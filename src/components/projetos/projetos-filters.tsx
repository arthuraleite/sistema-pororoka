"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  ProjetosFiltros,
  StatusProjeto,
  TipoProjeto,
} from "@/types/projetos/projetos.types";

type Props = {
  filtros: ProjetosFiltros;
  onChange: (filtros: ProjetosFiltros) => void;
};

const TIPOS_OPTIONS: Array<{ value: TipoProjeto; label: string }> = [
  { value: "financiado", label: "Financiado" },
  { value: "interno", label: "Interno" },
];

const STATUS_OPTIONS: Array<{ value: StatusProjeto; label: string }> = [
  { value: "a_iniciar", label: "A iniciar" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "concluido", label: "Concluído" },
];

function ChipFiltro({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="badge-neutral inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium"
    >
      <span>{label}</span>
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

export function ProjetosFilters({ filtros, onChange }: Props) {
  const [buscaLocal, setBuscaLocal] = useState(() => filtros.busca ?? "");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const buscaNormalizada = buscaLocal.trim() || undefined;

      if (buscaNormalizada === filtros.busca) {
        return;
      }

      onChange({
        ...filtros,
        busca: buscaNormalizada,
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [buscaLocal, filtros, onChange]);

  const tipoSelecionado = filtros.tipo?.[0] ?? "";
  const statusSelecionado = filtros.status?.[0] ?? "";

  const chips = useMemo(() => {
    const ativos: Array<{
      key: string;
      label: string;
      onRemove: () => void;
    }> = [];

    if (tipoSelecionado) {
      const option = TIPOS_OPTIONS.find((item) => item.value === tipoSelecionado);

      if (option) {
        ativos.push({
          key: `tipo_${tipoSelecionado}`,
          label: `Tipo: ${option.label}`,
          onRemove: () =>
            onChange({
              ...filtros,
              tipo: undefined,
            }),
        });
      }
    }

    if (statusSelecionado) {
      const option = STATUS_OPTIONS.find(
        (item) => item.value === statusSelecionado,
      );

      if (option) {
        ativos.push({
          key: `status_${statusSelecionado}`,
          label: `Status: ${option.label}`,
          onRemove: () =>
            onChange({
              ...filtros,
              status: undefined,
            }),
        });
      }
    }

    if (filtros.busca?.trim()) {
      ativos.push({
        key: "busca",
        label: `Busca: ${filtros.busca.trim()}`,
        onRemove: () => {
          setBuscaLocal("");
          onChange({
            ...filtros,
            busca: undefined,
          });
        },
      });
    }

    return ativos;
  }, [filtros, onChange, statusSelecionado, tipoSelecionado]);

  return (
    <section
      className="panel-theme rounded-[var(--radius-2xl)] p-4 md:p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_220px_220px_220px]">
        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-4)" }}
          >
            Busca
          </p>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-4)" }}
            />
            <input
              type="text"
              value={buscaLocal}
              onChange={(event) => setBuscaLocal(event.target.value)}
              placeholder="Buscar por nome, sigla, coordenador ou financiador"
              className="h-11 w-full rounded-2xl pl-11 pr-4 text-sm outline-none"
              style={{
                backgroundColor: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-4)" }}
          >
            Tipo
          </p>

          <select
            value={tipoSelecionado}
            onChange={(event) =>
              onChange({
                ...filtros,
                tipo: event.target.value
                  ? [event.target.value as TipoProjeto]
                  : undefined,
              })
            }
            className="h-11 w-full rounded-2xl px-4 text-sm outline-none"
            style={{
              backgroundColor: "var(--input)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}
          >
            <option value="">Todos</option>
            {TIPOS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-4)" }}
          >
            Status
          </p>

          <select
            value={statusSelecionado}
            onChange={(event) =>
              onChange({
                ...filtros,
                status: event.target.value
                  ? [event.target.value as StatusProjeto]
                  : undefined,
              })
            }
            className="h-11 w-full rounded-2xl px-4 text-sm outline-none"
            style={{
              backgroundColor: "var(--input)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--text-4)" }}
          >
            Ordenação
          </p>

          <select
            value={filtros.ordenacao ?? "data_inicio"}
            onChange={(event) =>
              onChange({
                ...filtros,
                ordenacao: event.target.value as ProjetosFiltros["ordenacao"],
              })
            }
            className="h-11 w-full rounded-2xl px-4 text-sm outline-none"
            style={{
              backgroundColor: "var(--input)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
            }}
          >
            <option value="data_inicio">Data de início</option>
            <option value="nome">Nome</option>
            <option value="orcamento_total">Orçamento total</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {chips.length > 0 ? (
          <>
            {chips.map((chip) => (
              <ChipFiltro
                key={chip.key}
                label={chip.label}
                onRemove={chip.onRemove}
              />
            ))}

            <button
              type="button"
              onClick={() => {
                setBuscaLocal("");
                onChange({
                  ordenacao: filtros.ordenacao ?? "data_inicio",
                });
              }}
              className="button-neutral inline-flex h-9 items-center rounded-full px-4 text-xs font-medium"
            >
              Limpar filtros
            </button>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-4)" }}>
            Nenhum filtro ativo.
          </p>
        )}
      </div>
    </section>
  );
}