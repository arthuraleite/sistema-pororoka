"use client";

import type { ChangeEvent } from "react";

import type { EquipeTarefaOption } from "@/actions/tarefas/listar-equipes-tarefas";
import type {
  CategoriaTarefa,
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
  equipes?: EquipeTarefaOption[];
  categorias?: CategoriaTarefa[];
  mostrarFiltroEscopoObjetivo?: boolean;
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

function possuiFiltrosAtivos(filtros: TarefasFiltros) {
  return Boolean(
    filtros.busca?.trim() ||
      filtros.status?.length ||
      filtros.prioridades?.length ||
      filtros.responsavelIds?.length ||
      filtros.equipeIds?.length ||
      filtros.categoriaIds?.length ||
      filtros.dataInicio ||
      filtros.dataFim ||
      filtros.apenasAtrasadas ||
      (filtros.escopoObjetivo &&
        filtros.escopoObjetivo !== "todos" &&
        filtros.escopoObjetivo !== "") ||
      (filtros.ordenacao && filtros.ordenacao !== "data_entrega"),
  );
}

function labelStatus(value?: StatusTarefa) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

function labelPrioridade(value?: PrioridadeTarefa) {
  return (
    prioridadeOptions.find((option) => option.value === value)?.label ?? value
  );
}

function labelOrdenacao(
  value?: "alfabetica" | "prioridade" | "status" | "data_entrega",
) {
  return (
    ordenacaoOptions.find((option) => option.value === value)?.label ?? value
  );
}

function labelResponsavel(
  id: string | undefined,
  usuarios: UsuarioResumoTarefa[],
) {
  if (!id) return null;
  return usuarios.find((usuario) => usuario.id === id)?.nome ?? "Responsável";
}

function labelEscopoObjetivo(
  value: string | undefined,
  equipes: EquipeTarefaOption[],
) {
  if (!value || value === "todos") return null;
  if (value === "global") return "Objetivos Globais";
  return equipes.find((equipe) => equipe.id === value)?.nome ?? "Equipe";
}

function labelEquipe(id: string | undefined, equipes: EquipeTarefaOption[]) {
  if (!id) return null;
  return equipes.find((equipe) => equipe.id === id)?.nome ?? "Equipe";
}

function labelCategoria(id: string | undefined, categorias: CategoriaTarefa[]) {
  if (!id) return null;
  return categorias.find((categoria) => categoria.id === id)?.nome ?? "Categoria";
}

export function TarefasFilters({
  contexto,
  filtros,
  usuarios,
  onChange,
  compact = false,
  equipes = [],
  categorias = [],
  mostrarFiltroEscopoObjetivo = false,
}: Props) {
  const isObjetivos = contexto === "objetivos";
  const mostrarFiltroEquipe = !isObjetivos && equipes.length > 0;
  const mostrarFiltroCategoria = !isObjetivos;
  const categoriasDisponiveis = filtros.equipeIds?.[0]
    ? categorias.filter((categoria) => categoria.equipeId === filtros.equipeIds?.[0])
    : [];
  const filtroCategoriaDesabilitado = mostrarFiltroEquipe && !filtros.equipeIds?.[0];
  const filtrosAtivos = possuiFiltrosAtivos(filtros);

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

  function handleEquipeChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    onChange({
      ...filtros,
      equipeIds: value ? [value] : [],
      categoriaIds: [],
    });
  }

  function handleCategoriaChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    onChange({
      ...filtros,
      categoriaIds: value ? [value] : [],
    });
  }

  function handleEscopoObjetivoChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    onChange({
      ...filtros,
      escopoObjetivo: value || "todos",
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
      equipeIds: [],
      escopoObjetivo: "todos",
    });
  }

  const gridClassCompact = [
    "grid gap-3",
    isObjetivos
      ? mostrarFiltroEscopoObjetivo
        ? "md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]"
        : "md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]"
      : mostrarFiltroEquipe
        ? "xl:grid-cols-[minmax(220px,1.55fr)_repeat(6,minmax(140px,1fr))]"
        : "xl:grid-cols-[minmax(220px,1.55fr)_repeat(5,minmax(140px,1fr))]",
  ].join(" ");

  const gridClassDefault = [
    "grid gap-3",
    isObjetivos
      ? mostrarFiltroEscopoObjetivo
        ? "md:grid-cols-2 xl:grid-cols-6"
        : "md:grid-cols-2 xl:grid-cols-5"
      : mostrarFiltroEquipe
        ? "xl:grid-cols-[minmax(220px,1.55fr)_repeat(6,minmax(140px,1fr))]"
        : "xl:grid-cols-[minmax(220px,1.55fr)_repeat(5,minmax(140px,1fr))]",
  ].join(" ");

  const filtrosAtivosNode = filtrosAtivos ? (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span
        className="text-[10px] font-medium uppercase tracking-[0.14em]"
        style={{ color: "var(--text-4)" }}
      >
        Filtros ativos
      </span>

      {filtros.escopoObjetivo &&
      filtros.escopoObjetivo !== "todos" &&
      filtros.escopoObjetivo !== "" ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Escopo: {labelEscopoObjetivo(filtros.escopoObjetivo, equipes)}
        </span>
      ) : null}

      {filtros.equipeIds?.[0] ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Equipe: {labelEquipe(filtros.equipeIds[0], equipes)}
        </span>
      ) : null}

      {filtros.categoriaIds?.[0] ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Categoria: {labelCategoria(filtros.categoriaIds[0], categorias)}
        </span>
      ) : null}

      {filtros.responsavelIds?.[0] ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Responsável: {labelResponsavel(filtros.responsavelIds[0], usuarios)}
        </span>
      ) : null}

      {filtros.status?.[0] ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Status: {labelStatus(filtros.status[0])}
        </span>
      ) : null}

      {filtros.prioridades?.[0] ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Prioridade: {labelPrioridade(filtros.prioridades[0])}
        </span>
      ) : null}

      {filtros.busca?.trim() ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Busca: {filtros.busca.trim()}
        </span>
      ) : null}

      {filtros.ordenacao && filtros.ordenacao !== "data_entrega" ? (
        <span className="badge-neutral rounded-full px-3 py-1 text-[11px]">
          Ordenação: {labelOrdenacao(filtros.ordenacao)}
        </span>
      ) : null}

      <button
        type="button"
        onClick={limparFiltros}
        className="button-neutral rounded-full px-3 py-1 text-[11px] font-medium"
      >
        Limpar filtros
      </button>
    </div>
  ) : null;

  if (compact) {
    return (
      <div
        className="rounded-2xl p-3"
        style={{
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface-0)",
        }}
      >
        <div className="overflow-x-auto">
          <div className={`${gridClassCompact} min-w-[1180px] xl:min-w-0`}>
          <div>
            <label className={labelClassName} style={labelStyle}>
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busca ?? ""}
              onChange={handleBusca}
              placeholder="Buscar por texto"
              className={fieldClassName(true)}
              style={fieldStyle()}
            />
          </div>

          {isObjetivos && mostrarFiltroEscopoObjetivo ? (
            <div>
              <label className={labelClassName} style={labelStyle}>
                Escopo
              </label>
              <select
                value={filtros.escopoObjetivo ?? "todos"}
                onChange={handleEscopoObjetivoChange}
                className={fieldClassName(true)}
                style={fieldStyle()}
              >
                <option value="todos">Todos os objetivos visíveis</option>
                <option value="global">Objetivos Globais</option>
                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {mostrarFiltroEquipe ? (
            <div>
              <label className={labelClassName} style={labelStyle}>
                Equipe
              </label>
              <select
                value={filtros.equipeIds?.[0] ?? ""}
                onChange={handleEquipeChange}
                className={fieldClassName(true)}
                style={fieldStyle()}
              >
                <option value="">Todas</option>
                {equipes.map((equipe) => (
                  <option key={equipe.id} value={equipe.id}>
                    {equipe.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {mostrarFiltroCategoria ? (
            <div>
              <label className={labelClassName} style={labelStyle}>
                Categoria
              </label>
              <select
                value={filtros.categoriaIds?.[0] ?? ""}
                onChange={handleCategoriaChange}
                disabled={filtroCategoriaDesabilitado}
                className={fieldClassName(true)}
                style={fieldStyle()}
              >
                <option value="">{filtroCategoriaDesabilitado ? "Selecione uma equipe" : "Todas"}</option>
                {categoriasDisponiveis.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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
          </div>
        </div>

        {filtrosAtivosNode}
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
      <div className="mb-3">
        <SectionTitle
          title={isObjetivos ? "Filtros de Objetivos" : "Filtros de Tarefas"}
          description={
            isObjetivos
              ? "Refine a busca dos objetivos visíveis para você."
              : "Refine a busca das tarefas e organize melhor a execução."
          }
        />
      </div>

      <div className="overflow-x-auto">
        <div className={`${gridClassDefault} min-w-[1180px] xl:min-w-0`}>
        <div>
          <label className={labelClassName} style={labelStyle}>
            Buscar
          </label>
          <input
            type="text"
            value={filtros.busca ?? ""}
            onChange={handleBusca}
            placeholder={
              isObjetivos ? "Título ou descrição" : "Título, descrição ou categoria"
            }
            className={fieldClassName(false)}
            style={fieldStyle()}
          />
        </div>

        {isObjetivos && mostrarFiltroEscopoObjetivo ? (
          <div>
            <label className={labelClassName} style={labelStyle}>
              Escopo
            </label>
            <select
              value={filtros.escopoObjetivo ?? "todos"}
              onChange={handleEscopoObjetivoChange}
              className={fieldClassName(false)}
              style={fieldStyle()}
            >
              <option value="todos">Todos os objetivos visíveis</option>
              <option value="global">Objetivos Globais</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {mostrarFiltroEquipe ? (
          <div>
            <label className={labelClassName} style={labelStyle}>
              Equipe
            </label>
            <select
              value={filtros.equipeIds?.[0] ?? ""}
              onChange={handleEquipeChange}
              className={fieldClassName(false)}
              style={fieldStyle()}
            >
              <option value="">Todas</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {mostrarFiltroCategoria ? (
          <div>
            <label className={labelClassName} style={labelStyle}>
              Categoria
            </label>
            <select
              value={filtros.categoriaIds?.[0] ?? ""}
              onChange={handleCategoriaChange}
              disabled={filtroCategoriaDesabilitado}
              className={fieldClassName(false)}
              style={fieldStyle()}
            >
              <option value="">{filtroCategoriaDesabilitado ? "Selecione uma equipe" : "Todas"}</option>
              {categoriasDisponiveis.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}

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

        <div>
          <label className={labelClassName} style={labelStyle}>
            Ordenação
          </label>
          <select
            value={filtros.ordenacao ?? "data_entrega"}
            onChange={handleOrdenacaoChange}
            className={fieldClassName(false)}
            style={fieldStyle()}
          >
            {ordenacaoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        </div>
      </div>

      {filtrosAtivosNode}
    </section>
  );
}
