"use client";

import type { ChangeEvent } from "react";

import type {
  PrioridadeTarefa,
  StatusTarefa,
  TarefasFiltros,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type Props = {
  contexto: "objetivos" | "tarefas";
  filtros: TarefasFiltros;
  usuarios: UsuarioResumoTarefa[];
  onChange: (filtros: TarefasFiltros) => void;
  compact?: boolean;
};

const statusOptions: Array<{ value: StatusTarefa; label: string }> = [
  { value: "a_fazer", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "atencao", label: "Atenção" },
  { value: "em_pausa", label: "Em pausa" },
  { value: "em_atraso", label: "Em atraso" },
  { value: "concluida", label: "Concluída" },
];

const prioridadeOptions: Array<{ value: PrioridadeTarefa; label: string }> = [
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const ordenacaoOptions = [
  { value: "data_entrega", label: "Data de entrega" },
  { value: "alfabetica", label: "Alfabética" },
  { value: "prioridade", label: "Prioridade" },
  { value: "status", label: "Status" },
] as const;

const labelClassName =
  "mb-1.5 block pl-0.5 text-[10px] font-medium uppercase tracking-[0.14em]";
const labelStyle = { color: "var(--text-4)" } as const;

function fieldClassName(compact: boolean) {
  return [
    "w-full rounded-xl px-3 text-sm outline-none transition",
    compact ? "h-[34px]" : "h-9",
  ].join(" ");
}

function fieldStyle() {
  return {
    backgroundColor: "var(--input)",
    color: "var(--input-foreground)",
    border: "1px solid var(--border)",
  } as const;
}

function clearButtonStyle() {
  return {
    backgroundColor: "var(--button-primary)",
    color: "var(--button-primary-foreground)",
    border: "1px solid transparent",
  } as const;
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
        {title}
      </h2>
      <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
        {description}
      </p>
    </div>
  );
}

export function TarefasFilters({
  contexto,
  filtros,
  usuarios,
  onChange,
  compact = false,
}: Props) {
  const isObjetivos = contexto === "objetivos";

  function handleBusca(event: ChangeEvent<HTMLInputElement>) {
    onChange({
      ...filtros,
      busca: event.target.value,
    });
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as StatusTarefa | "";
    onChange({
      ...filtros,
      status: value ? [value] : [],
    });
  }

  function handlePrioridadeChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as PrioridadeTarefa | "";
    onChange({
      ...filtros,
      prioridades: value ? [value] : [],
    });
  }

  function handleResponsavelChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    onChange({
      ...filtros,
      responsavelIds: value ? [value] : [],
    });
  }

  function handleOrdenacaoChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as
      | "alfabetica"
      | "prioridade"
      | "status"
      | "data_entrega";

    onChange({
      ...filtros,
      ordenacao: value,
    });
  }

  function limparFiltros() {
    onChange({
      ordenacao: "data_entrega",
      busca: "",
      status: [],
      prioridades: [],
      responsavelIds: [],
    });
  }

  // const filtrosAtivos =
  //   Boolean(filtros.busca?.trim()) ||
  //   Boolean(filtros.status?.length) ||
  //   Boolean(filtros.prioridades?.length) ||
  //   Boolean(filtros.responsavelIds?.length) ||
  //   Boolean(filtros.ordenacao && filtros.ordenacao !== "data_entrega");

  if (compact) {
    return (
      <div
        className="rounded-2xl p-3"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-0)",
        }}
      >
        <div
          className={[
            "grid gap-3",
            isObjetivos
              ? "md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))_auto]"
              : "md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))_auto]",
          ].join(" ")}
        >
          <div>
            <label className={labelClassName} style={labelStyle}>
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busca ?? ""}
              onChange={handleBusca}
              placeholder={
                isObjetivos
                  ? "Título ou descrição"
                  : "Título, descrição ou categoria"
              }
              className={fieldClassName(true)}
              style={fieldStyle()}
            />
          </div>

          <div>
            <label className={labelClassName} style={labelStyle}>
              Status
            </label>
            <select
              value={filtros.status?.[0] ?? ""}
              onChange={handleStatusChange}
              className={fieldClassName(true)}
              style={fieldStyle()}
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName} style={labelStyle}>
              Prioridade
            </label>
            <select
              value={filtros.prioridades?.[0] ?? ""}
              onChange={handlePrioridadeChange}
              className={fieldClassName(true)}
              style={fieldStyle()}
            >
              <option value="">Todas</option>
              {prioridadeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {!isObjetivos ? (
            <div>
              <label className={labelClassName} style={labelStyle}>
                Responsável
              </label>
              <select
                value={filtros.responsavelIds?.[0] ?? ""}
                onChange={handleResponsavelChange}
                className={fieldClassName(true)}
                style={fieldStyle()}
              >
                <option value="">Todos</option>
                {usuarios.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className={labelClassName} style={labelStyle}>
              Ordenação
            </label>
            <select
              value={filtros.ordenacao ?? "data_entrega"}
              onChange={handleOrdenacaoChange}
              className={fieldClassName(true)}
              style={fieldStyle()}
            >
              {ordenacaoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex h-[34px] w-full items-center justify-center rounded-xl px-3 text-sm font-medium transition"
              style={clearButtonStyle()}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl p-3.5 backdrop-blur-sm"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface-1)",
      }}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title={isObjetivos ? "Filtros de Objetivos" : "Filtros de Tarefas"}
          description={
            isObjetivos
              ? "Refine a busca dos objetivos visíveis para você."
              : "Refine a busca das tarefas e organize melhor a execução."
          }
        />

        <button
          type="button"
          onClick={limparFiltros}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl px-3 text-sm font-medium transition"
          style={clearButtonStyle()}
        >
          Limpar filtros
        </button>
      </div>

      <div
        className={[
          "grid gap-3",
          isObjetivos
            ? "md:grid-cols-2 xl:grid-cols-4"
            : "md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]",
        ].join(" ")}
      >
        <div>
          <label className={labelClassName} style={labelStyle}>
            Buscar
          </label>
          <input
            type="text"
            value={filtros.busca ?? ""}
            onChange={handleBusca}
            placeholder={
              isObjetivos
                ? "Título ou descrição"
                : "Título, descrição ou categoria"
            }
            className={fieldClassName(false)}
            style={fieldStyle()}
          />
        </div>

        <div>
          <label className={labelClassName} style={labelStyle}>
            Status
          </label>
          <select
            value={filtros.status?.[0] ?? ""}
            onChange={handleStatusChange}
            className={fieldClassName(false)}
            style={fieldStyle()}
          >
            <option value="">Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClassName} style={labelStyle}>
            Prioridade
          </label>
          <select
            value={filtros.prioridades?.[0] ?? ""}
            onChange={handlePrioridadeChange}
            className={fieldClassName(false)}
            style={fieldStyle()}
          >
            <option value="">Todas</option>
            {prioridadeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {!isObjetivos ? (
          <div>
            <label className={labelClassName} style={labelStyle}>
              Responsável
            </label>
            <select
              value={filtros.responsavelIds?.[0] ?? ""}
              onChange={handleResponsavelChange}
              className={fieldClassName(false)}
              style={fieldStyle()}
            >
              <option value="">Todos</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className={labelClassName} style={labelStyle}>
            Ordenação
          </label>
          <select
            value={filtros.ordenacao ?? "data_entrega"}
            onChange={handleOrdenacaoChange}
            className={fieldClassName(false)}
            style={fieldStyle()} >
            {ordenacaoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}