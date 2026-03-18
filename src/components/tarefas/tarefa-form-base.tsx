"use client";

import Image from "next/image";
import { CalendarDays, Clock3, FolderKanban, Search, Tag, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { criarCategoriaTarefa } from "@/actions/tarefas/criar-categoria-tarefa";
import { TarefaLinksField } from "@/components/tarefas/tarefa-links-field";
import { TarefaResponsaveisField } from "@/components/tarefas/tarefa-responsaveis-field";
import type {
  CategoriaTarefa,
  EscopoObjetivo,
  PrioridadeTarefa,
  StatusTarefa,
  TipoTarefa,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type LinkItem = {
  id?: string;
  url: string;
  texto?: string | null;
};

type EquipeOption = {
  id: string;
  nome: string;
};

type Props = {
  mode: "create" | "edit" | "view";
  tipo: TipoTarefa;
  initialValues?: {
    titulo?: string;
    descricao?: string | null;
    tarefaPaiId?: string | null;
    equipeId?: string | null;
    categoriaId?: string | null;
    projetoId?: string | null;
    escopoObjetivo?: EscopoObjetivo;
    prioridade?: PrioridadeTarefa | null;
    status?: StatusTarefa;
    dataEntrega?: string;
    horaEntrega?: string | null;
    responsavelIds?: string[];
    links?: LinkItem[];
  };
  usuarios: UsuarioResumoTarefa[];
  equipes?: EquipeOption[];
  categorias?: CategoriaTarefa[];
  tarefasPaiOptions?: Array<{ id: string; titulo: string }>;
  allowTipoSelector?: boolean;
  allowProjeto?: boolean;
  allowEquipe?: boolean;
  allowCategoria?: boolean;
  allowStatus?: boolean;
  allowPrioridade?: boolean;
  allowEscopoObjetivo?: boolean;
  canSelectObjetivoGlobal?: boolean;
  onSubmit?: (values: {
    tipo: TipoTarefa;
    titulo: string;
    descricao?: string | null;
    tarefaPaiId?: string | null;
    equipeId?: string | null;
    categoriaId?: string | null;
    projetoId?: string | null;
    escopoObjetivo?: EscopoObjetivo | null;
    prioridade?: PrioridadeTarefa | null;
    status?: StatusTarefa;
    dataEntrega: string;
    horaEntrega?: string | null;
    responsavelIds: string[];
    links: LinkItem[];
  }) => void | Promise<void>;
  submitLabel?: string;
  formId?: string;
  hideInternalSubmit?: boolean;
  hideProjetoWhenEscopoEquipe?: boolean;
  lockEquipeSelection?: boolean;
  lockTarefaPaiSelection?: boolean;
  onTituloChange?: (titulo: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const prioridades: Array<{ value: PrioridadeTarefa; label: string }> = [
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const statusOptions: Array<{ value: StatusTarefa; label: string }> = [
  { value: "a_fazer", label: "A fazer" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "atencao", label: "Atenção" },
  { value: "em_pausa", label: "Em pausa" },
  { value: "em_atraso", label: "Em atraso" },
  { value: "concluida", label: "Concluída" },
];

const escopoObjetivoOptions: Array<{ value: EscopoObjetivo; label: string }> = [
  { value: "global", label: "Objetivo global" },
  { value: "equipe", label: "Objetivo de equipe" },
];

function inputClass(disabled = false) {
  return [
    "h-11 w-full rounded-2xl px-4 text-sm outline-none transition",
    disabled ? "cursor-not-allowed opacity-60" : "",
  ].join(" ");
}

function textAreaClass(disabled = false) {
  return [
    "w-full rounded-2xl px-4 py-3 text-sm outline-none transition",
    disabled ? "cursor-not-allowed opacity-60" : "",
  ].join(" ");
}

function FieldLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label
      className="mb-2 flex items-center gap-2 text-sm font-medium"
      style={{ color: "var(--text-2)" }}
    >
      {icon ? <span style={{ color: "var(--text-4)" }}>{icon}</span> : null}
      <span>{children}</span>
    </label>
  );
}

function DropdownField({
  label,
  icon,
  value,
  placeholder,
  open,
  onToggle,
  disabled,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  value?: string | null;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <FieldLabel icon={icon}>{label}</FieldLabel>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={inputClass(Boolean(disabled))}
        style={{
          backgroundColor: "var(--input)",
          border: "1px solid var(--border)",
          color: value ? "var(--text-1)" : "var(--placeholder)",
        }}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="truncate">{value || placeholder}</span>
          <span style={{ color: "var(--text-4)" }}>{open ? "▴" : "▾"}</span>
        </span>
      </button>
      {open ? (
        <div
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function DropdownOption({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="interactive-surface flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition"
      style={{ color: "var(--text-2)" }}
    >
      {children}
    </button>
  );
}

export function TarefaFormBase({
  mode,
  tipo,
  initialValues,
  usuarios,
  equipes = [],
  categorias = [],
  tarefasPaiOptions = [],
  allowTipoSelector = false,
  allowProjeto = false,
  allowEquipe = false,
  allowCategoria = false,
  allowStatus = false,
  allowPrioridade = false,
  allowEscopoObjetivo = false,
  canSelectObjetivoGlobal = false,
  onSubmit,
  submitLabel,
  formId,
  hideInternalSubmit = false,
  hideProjetoWhenEscopoEquipe = false,
  lockEquipeSelection = false,
  lockTarefaPaiSelection = false,
  onTituloChange,
  onDirtyChange,
}: Props) {
  const readonly = mode === "view";

  const [tipoAtual, setTipoAtual] = useState<TipoTarefa>(tipo);
  const [escopoObjetivo, setEscopoObjetivo] = useState<EscopoObjetivo>(
    initialValues?.escopoObjetivo ??
      (tipo === "pai" && !canSelectObjetivoGlobal ? "equipe" : "global"),
  );
  const [titulo, setTitulo] = useState(initialValues?.titulo ?? "");
  const [descricao, setDescricao] = useState(initialValues?.descricao ?? "");
  const [tarefaPaiId, setTarefaPaiId] = useState(initialValues?.tarefaPaiId ?? "");
  const [equipeId, setEquipeId] = useState(initialValues?.equipeId ?? "");
  const [categoriaId, setCategoriaId] = useState(initialValues?.categoriaId ?? "");
  const [projetoId, setProjetoId] = useState(initialValues?.projetoId ?? "");
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa | "">(
    initialValues?.prioridade ?? "",
  );
  const [status, setStatus] = useState<StatusTarefa>(
    initialValues?.status ?? "a_fazer",
  );
  const [dataEntrega, setDataEntrega] = useState(initialValues?.dataEntrega ?? "");
  const [horaEntrega, setHoraEntrega] = useState(initialValues?.horaEntrega ?? "");
  const [responsavelIds, setResponsavelIds] = useState<string[]>(
    initialValues?.responsavelIds ?? [],
  );
  const [links, setLinks] = useState<LinkItem[]>(initialValues?.links ?? []);
  const [submitting, setSubmitting] = useState(false);

  const [categoriasCriadasLocalmente, setCategoriasCriadasLocalmente] = useState<
    CategoriaTarefa[]
  >([]);
  const [categoriaBusca, setCategoriaBusca] = useState("");
  const [mostrarEquipeMenu, setMostrarEquipeMenu] = useState(false);
  const [mostrarTarefaPaiMenu, setMostrarTarefaPaiMenu] = useState(false);
  const [mostrarPrioridadeMenu, setMostrarPrioridadeMenu] = useState(false);
  const [mostrarStatusMenu, setMostrarStatusMenu] = useState(false);
  const [mostrarEscopoMenu, setMostrarEscopoMenu] = useState(false);
  const [mostrarCategoriaPopover, setMostrarCategoriaPopover] = useState(false);

  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [novaCategoriaDescricao, setNovaCategoriaDescricao] = useState("");
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onTituloChange?.(titulo);
  }, [titulo, onTituloChange]);

  useEffect(() => {
    const dirty =
      (initialValues?.titulo ?? "") !== titulo ||
      (initialValues?.descricao ?? "") !== descricao ||
      (initialValues?.tarefaPaiId ?? "") !== tarefaPaiId ||
      (initialValues?.equipeId ?? "") !== equipeId ||
      (initialValues?.categoriaId ?? "") !== categoriaId ||
      (initialValues?.projetoId ?? "") !== projetoId ||
      (initialValues?.escopoObjetivo ?? null) !== escopoObjetivo ||
      (initialValues?.prioridade ?? "") !== prioridade ||
      (initialValues?.status ?? "a_fazer") !== status ||
      (initialValues?.dataEntrega ?? "") !== dataEntrega ||
      (initialValues?.horaEntrega ?? "") !== horaEntrega ||
      JSON.stringify(initialValues?.responsavelIds ?? []) !==
        JSON.stringify(responsavelIds) ||
      JSON.stringify(initialValues?.links ?? []) !== JSON.stringify(links);

    onDirtyChange?.(dirty);
  }, [
    titulo,
    descricao,
    tarefaPaiId,
    equipeId,
    categoriaId,
    projetoId,
    escopoObjetivo,
    prioridade,
    status,
    dataEntrega,
    horaEntrega,
    responsavelIds,
    links,
    initialValues,
    onDirtyChange,
  ]);

  useEffect(() => {
    if (tipoAtual === "pai" && !canSelectObjetivoGlobal && escopoObjetivo !== "equipe") {
      setEscopoObjetivo("equipe");
    }
  }, [tipoAtual, canSelectObjetivoGlobal, escopoObjetivo]);

  useEffect(() => {
    if (tipoAtual === "pai" && escopoObjetivo === "global") {
      setEquipeId("");
      setCategoriaId("");
      setCategoriaBusca("");
    }
  }, [tipoAtual, escopoObjetivo]);

  useEffect(() => {
    if (
      allowEquipe &&
      (tipoAtual !== "pai" || escopoObjetivo === "equipe") &&
      !readonly &&
      mode === "create" &&
      !equipeId &&
      equipes.length === 1
    ) {
      setEquipeId(equipes[0].id);
    }
  }, [allowEquipe, tipoAtual, escopoObjetivo, readonly, mode, equipeId, equipes]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMostrarEquipeMenu(false);
        setMostrarTarefaPaiMenu(false);
        setMostrarPrioridadeMenu(false);
        setMostrarStatusMenu(false);
        setMostrarEscopoMenu(false);
        setMostrarCategoriaPopover(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categoriasMescladas = useMemo(() => {
    const mapa = new Map<string, CategoriaTarefa>();
    for (const categoria of categorias) mapa.set(categoria.id, categoria);
    for (const categoria of categoriasCriadasLocalmente) mapa.set(categoria.id, categoria);
    return Array.from(mapa.values());
  }, [categorias, categoriasCriadasLocalmente]);

  const categoriasDaEquipe = useMemo(() => {
    if (!equipeId) return [];
    return categoriasMescladas.filter((categoria) => categoria.equipeId === equipeId);
  }, [categoriasMescladas, equipeId]);

  const categoriaSelecionada = useMemo(
    () => categoriasMescladas.find((item) => item.id === categoriaId) ?? null,
    [categoriasMescladas, categoriaId],
  );

  const categoriasFiltradas = useMemo(() => {
    const termo = categoriaBusca.trim().toLowerCase();

    return categoriasDaEquipe
      .filter((categoria) => categoria.id !== categoriaId)
      .filter((categoria) => {
        if (!termo) return true;
        return categoria.nome.toLowerCase().includes(termo);
      });
  }, [categoriasDaEquipe, categoriaBusca, categoriaId]);

  const equipeSelecionada = useMemo(
    () => equipes.find((item) => item.id === equipeId) ?? null,
    [equipes, equipeId],
  );

  const tarefaPaiSelecionada = useMemo(
    () => tarefasPaiOptions.find((item) => item.id === tarefaPaiId) ?? null,
    [tarefasPaiOptions, tarefaPaiId],
  );

  const escopoSelecionado = useMemo(
    () => escopoObjetivoOptions.find((item) => item.value === escopoObjetivo) ?? null,
    [escopoObjetivo],
  );

  const usuariosElegiveis = useMemo(() => {
    if (tipoAtual === "pai") {
      return usuarios.filter((usuario) =>
        ["admin_supremo", "coordenador_geral", "coordenador_equipe", "assistente", "gestor_financeiro"].includes(usuario.perfil),
      );
    }

    return usuarios.filter((usuario) => usuario.perfil !== "analista_financeiro");
  }, [tipoAtual, usuarios]);

  async function handleCriarCategoria() {
    setErroCategoria(null);

    if (!equipeId) {
      setErroCategoria("Selecione uma equipe antes de criar a categoria.");
      return;
    }

    if (!novaCategoriaNome.trim()) {
      setErroCategoria("Informe o nome da categoria.");
      return;
    }

    setSalvandoCategoria(true);

    try {
      const resultado = await criarCategoriaTarefa({
        equipeId,
        nome: novaCategoriaNome.trim(),
        descricao: novaCategoriaDescricao.trim() || null,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível criar a categoria.");
      }

      setCategoriasCriadasLocalmente((current) =>
        current.some((item) => item.id === resultado.data?.id)
          ? current
          : [...current, resultado.data!],
      );

      setCategoriaId(resultado.data.id);
      setCategoriaBusca("");
      setNovaCategoriaNome("");
      setNovaCategoriaDescricao("");
      setModalCategoriaOpen(false);
      setMostrarCategoriaPopover(false);
      setErroCategoria(null);
    } catch (error) {
      setErroCategoria(error instanceof Error ? error.message : "Erro ao criar categoria.");
    } finally {
      setSalvandoCategoria(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readonly || !onSubmit) return;
    if (!titulo.trim()) return;
    if (!dataEntrega) return;
    if (tipoAtual === "filha" && !tarefaPaiId) return;
    if (tipoAtual === "pai" && escopoObjetivo === "equipe" && !equipeId) return;
    if (tipoAtual !== "pai" && !equipeId) return;
    if (tipoAtual !== "pai" && !categoriaId) return;
    if (tipoAtual !== "pai" && !prioridade) return;
    if (responsavelIds.length === 0) return;

    const linksNormalizados = links
      .map((link) => ({
        ...link,
        url: link.url?.trim() ?? "",
        texto: link.texto?.trim() || null,
      }))
      .filter((link) => link.url !== "");

    setSubmitting(true);

    try {
      await onSubmit({
        tipo: tipoAtual,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        tarefaPaiId: tarefaPaiId || null,
        equipeId:
          tipoAtual === "pai"
            ? escopoObjetivo === "equipe"
              ? equipeId || null
              : null
            : equipeId || null,
        categoriaId: categoriaId || null,
        projetoId: projetoId.trim() || null,
        escopoObjetivo: tipoAtual === "pai" ? escopoObjetivo : null,
        prioridade: prioridade || null,
        status,
        dataEntrega,
        horaEntrega: horaEntrega || null,
        responsavelIds,
        links: linksNormalizados,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const resolvedSubmitLabel =
    submitLabel ?? (mode === "create" ? "Salvar" : mode === "edit" ? "Atualizar" : "Fechar");

  const mostrarCampoEquipe = allowEquipe && (tipoAtual !== "pai" || escopoObjetivo === "equipe");
  const mostrarProjeto = allowProjeto && tipoAtual === "pai" && !(hideProjetoWhenEscopoEquipe && escopoObjetivo === "equipe");

  return (
    <>
      <div ref={containerRef}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          {allowTipoSelector ? (
            <section
              className="rounded-[24px] p-4"
              style={{
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--border)",
              }}
            >
              <FieldLabel>Tipo</FieldLabel>
              <select
                value={tipoAtual}
                onChange={(event) => setTipoAtual(event.target.value as TipoTarefa)}
                disabled={readonly}
                className={inputClass(readonly)}
                style={{
                  backgroundColor: "var(--input)",
                  border: "1px solid var(--border)",
                  color: "var(--text-1)",
                }}
              >
                <option value="orfa">Órfã</option>
                <option value="filha">Filha</option>
                <option value="pai">Pai</option>
              </select>
            </section>
          ) : null}

          <section
            className="rounded-[24px] p-4 md:p-5"
            style={{
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="space-y-5">
              <div>
                <FieldLabel>{tipoAtual === "pai" ? "Título do objetivo" : "Título"}</FieldLabel>
                <input
                  type="text"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  disabled={readonly}
                  className={inputClass(readonly)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  placeholder={
                    tipoAtual === "pai"
                      ? "Ex.: Estruturar ciclo de mobilização"
                      : "Título da tarefa"
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {tipoAtual === "pai" && allowEscopoObjetivo ? (
                  <DropdownField
                    label="Escopo"
                    icon={<Tag className="h-4 w-4" />}
                    value={escopoSelecionado?.label ?? null}
                    placeholder="Selecione o escopo"
                    open={mostrarEscopoMenu && !readonly}
                    onToggle={() => !readonly && setMostrarEscopoMenu((v) => !v)}
                    disabled={readonly}
                  >
                    <div className="max-h-56 overflow-y-auto p-1.5">
                      {escopoObjetivoOptions
                        .filter((item) =>
                          canSelectObjetivoGlobal ? true : item.value !== "global",
                        )
                        .map((item) => (
                          <DropdownOption
                            key={item.value}
                            onClick={() => {
                              setEscopoObjetivo(item.value);
                              setMostrarEscopoMenu(false);
                            }}
                          >
                            {item.label}
                          </DropdownOption>
                        ))}
                    </div>
                  </DropdownField>
                ) : null}

                {tipoAtual === "filha" ? (
                  lockTarefaPaiSelection ? (
                    <div>
                      <FieldLabel icon={<FolderKanban className="h-4 w-4" />}>
                        Objetivo-pai
                      </FieldLabel>
                      <input
                        type="text"
                        value={tarefaPaiSelecionada?.titulo ?? ""}
                        readOnly
                        className={inputClass(true)}
                        style={{
                          backgroundColor: "var(--input)",
                          border: "1px solid var(--border)",
                          color: "var(--text-1)",
                        }}
                      />
                    </div>
                  ) : (
                    <DropdownField
                      label="Objetivo-pai"
                      icon={<FolderKanban className="h-4 w-4" />}
                      value={tarefaPaiSelecionada?.titulo ?? null}
                      placeholder="Selecione o objetivo"
                      open={mostrarTarefaPaiMenu && !readonly}
                      onToggle={() => !readonly && setMostrarTarefaPaiMenu((v) => !v)}
                      disabled={readonly}
                    >
                      <div className="max-h-56 overflow-y-auto p-1.5">
                        {tarefasPaiOptions.map((item) => (
                          <DropdownOption
                            key={item.id}
                            onClick={() => {
                              setTarefaPaiId(item.id);
                              setMostrarTarefaPaiMenu(false);
                            }}
                          >
                            {item.titulo}
                          </DropdownOption>
                        ))}
                      </div>
                    </DropdownField>
                  )
                ) : null}

                {mostrarProjeto ? (
                  <div>
                    <FieldLabel icon={<FolderKanban className="h-4 w-4" />}>Projeto</FieldLabel>
                    <input
                      type="text"
                      value={projetoId}
                      onChange={(event) => setProjetoId(event.target.value)}
                      disabled={readonly}
                      className={inputClass(readonly)}
                      style={{
                        backgroundColor: "var(--input)",
                        border: "1px solid var(--border)",
                        color: "var(--text-1)",
                      }}
                      placeholder="Projeto vinculado"
                    />
                  </div>
                ) : null}

                {mostrarCampoEquipe ? (
                  lockEquipeSelection || equipes.length <= 1 ? (
                    <div>
                      <FieldLabel icon={<Users className="h-4 w-4" />}>Equipe</FieldLabel>
                      <input
                        type="text"
                        value={equipeSelecionada?.nome ?? equipes[0]?.nome ?? ""}
                        readOnly
                        className={inputClass(true)}
                        style={{
                          backgroundColor: "var(--input)",
                          border: "1px solid var(--border)",
                          color: "var(--text-1)",
                        }}
                      />
                    </div>
                  ) : (
                    <DropdownField
                      label="Equipe"
                      icon={<Users className="h-4 w-4" />}
                      value={equipeSelecionada?.nome ?? null}
                      placeholder="Selecione a equipe"
                      open={mostrarEquipeMenu && !readonly}
                      onToggle={() => !readonly && setMostrarEquipeMenu((v) => !v)}
                      disabled={readonly}
                    >
                      <div className="max-h-56 overflow-y-auto p-1.5">
                        {equipes.map((equipe) => (
                          <DropdownOption
                            key={equipe.id}
                            onClick={() => {
                              setEquipeId(equipe.id);
                              setCategoriaId("");
                              setCategoriaBusca("");
                              setMostrarEquipeMenu(false);
                            }}
                          >
                            {equipe.nome}
                          </DropdownOption>
                        ))}
                      </div>
                    </DropdownField>
                  )
                ) : null}

                {allowCategoria && tipoAtual !== "pai" ? (
                  <div className="relative">
                    <FieldLabel icon={<Tag className="h-4 w-4" />}>Categoria</FieldLabel>

                    <button
                      type="button"
                      onClick={() => !readonly && equipeId && setMostrarCategoriaPopover((v) => !v)}
                      disabled={readonly || !equipeId}
                      className="flex h-11 w-full items-center justify-between gap-3 rounded-2xl px-4 text-sm"
                      style={{
                        backgroundColor: "var(--input)",
                        border: "1px solid var(--border)",
                        color: categoriaSelecionada ? "var(--text-1)" : "var(--placeholder)",
                        opacity: readonly || !equipeId ? 0.6 : 1,
                      }}
                    >
                      <div className="min-w-0 flex-1 truncate">
                        {categoriaSelecionada?.nome ?? "Selecione uma categoria"}
                      </div>
                      <span style={{ color: "var(--text-4)" }}>
                        {mostrarCategoriaPopover ? "▴" : "▾"}
                      </span>
                    </button>

                    {mostrarCategoriaPopover && !readonly && equipeId ? (
                      <div
                        className="absolute z-30 mt-2 w-[min(96vw,520px)] overflow-hidden rounded-2xl"
                        style={{
                          backgroundColor: "var(--surface-1)",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-soft)",
                        }}
                      >
                        <div className="space-y-3 p-3">
                          <div
                            className="flex items-center gap-2 rounded-xl px-3 py-2"
                            style={{
                              backgroundColor: "var(--input)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <Search className="h-4 w-4" style={{ color: "var(--text-4)" }} />
                            <input
                              type="text"
                              value={categoriaBusca}
                              onChange={(event) => setCategoriaBusca(event.target.value)}
                              placeholder="Buscar categoria"
                              className="w-full bg-transparent text-sm outline-none"
                              style={{ color: "var(--text-1)" }}
                            />
                          </div>

                          {categoriaSelecionada ? (
                            <div className="space-y-1.5">
                              <div
                                className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: "var(--text-4)" }}
                              >
                                Categoria selecionada
                              </div>

                              <div
                                className="rounded-xl px-3 py-2 text-sm"
                                style={{
                                  backgroundColor: "var(--surface-1)",
                                  border: "1px solid var(--border)",
                                  color: "var(--text-2)",
                                }}
                              >
                                {categoriaSelecionada.nome}
                              </div>
                            </div>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              setErroCategoria(null);
                              setNovaCategoriaNome(categoriaBusca.trim());
                              setNovaCategoriaDescricao("");
                              setModalCategoriaOpen(true);
                            }}
                            className="button-neutral inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-medium"
                          >
                            Adicionar categoria
                          </button>

                          <div className="space-y-1.5">
                            <div
                              className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                              style={{ color: "var(--text-4)" }}
                            >
                              Categorias
                            </div>

                            <div className="space-y-1">
                              {categoriasFiltradas.slice(0, 5).length > 0 ? (
                                categoriasFiltradas.slice(0, 5).map((categoria) => (
                                  <button
                                    key={categoria.id}
                                    type="button"
                                    onClick={() => {
                                      setCategoriaId(categoria.id);
                                      setCategoriaBusca("");
                                      setMostrarCategoriaPopover(false);
                                    }}
                                    className="interactive-surface flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition"
                                    style={{ color: "var(--text-2)" }}
                                  >
                                    <span className="truncate">{categoria.nome}</span>
                                  </button>
                                ))
                              ) : (
                                <div
                                  className="rounded-xl border border-dashed px-3 py-3 text-sm"
                                  style={{
                                    borderColor: "var(--border)",
                                    backgroundColor: "var(--surface-1)",
                                    color: "var(--text-4)",
                                  }}
                                >
                                  Nenhuma categoria encontrada.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {allowPrioridade ? (
                  <DropdownField
                    label="Prioridade"
                    icon={<Tag className="h-4 w-4" />}
                    value={prioridades.find((item) => item.value === prioridade)?.label ?? null}
                    placeholder="Selecione a prioridade"
                    open={mostrarPrioridadeMenu && !readonly}
                    onToggle={() => !readonly && setMostrarPrioridadeMenu((v) => !v)}
                    disabled={readonly}
                  >
                    <div className="p-1.5">
                      {prioridades.map((item) => (
                        <DropdownOption
                          key={item.value}
                          onClick={() => {
                            setPrioridade(item.value);
                            setMostrarPrioridadeMenu(false);
                          }}
                        >
                          {item.label}
                        </DropdownOption>
                      ))}
                    </div>
                  </DropdownField>
                ) : null}

                {allowStatus ? (
                  <DropdownField
                    label="Status"
                    icon={<Tag className="h-4 w-4" />}
                    value={statusOptions.find((item) => item.value === status)?.label ?? null}
                    placeholder="Selecione o status"
                    open={mostrarStatusMenu && !readonly}
                    onToggle={() => !readonly && setMostrarStatusMenu((v) => !v)}
                    disabled={readonly}
                  >
                    <div className="p-1.5">
                      {statusOptions.map((item) => (
                        <DropdownOption
                          key={item.value}
                          onClick={() => {
                            setStatus(item.value);
                            setMostrarStatusMenu(false);
                          }}
                        >
                          {item.label}
                        </DropdownOption>
                      ))}
                    </div>
                  </DropdownField>
                ) : null}

                <div>
                  <FieldLabel icon={<CalendarDays className="h-4 w-4" />}>
                    Data de entrega
                  </FieldLabel>
                  <input
                    type="date"
                    value={dataEntrega}
                    onChange={(event) => setDataEntrega(event.target.value)}
                    disabled={readonly}
                    className={inputClass(readonly)}
                    style={{
                      backgroundColor: "var(--input)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                    }}
                  />
                </div>

                <div>
                  <FieldLabel icon={<Clock3 className="h-4 w-4" />}>Hora de entrega</FieldLabel>
                  <input
                    type="time"
                    value={horaEntrega}
                    onChange={(event) => setHoraEntrega(event.target.value)}
                    disabled={readonly}
                    className={inputClass(readonly)}
                    style={{
                      backgroundColor: "var(--input)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                    }}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Descrição</FieldLabel>
                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  disabled={readonly}
                  rows={3}
                  className={textAreaClass(readonly)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  placeholder="Descreva o contexto e os entregáveis esperados."
                />
              </div>
            </div>
          </section>

          <TarefaResponsaveisField
            usuarios={usuariosElegiveis}
            value={responsavelIds}
            onChange={setResponsavelIds}
            disabled={readonly}
            label="Responsáveis"
            description={`Selecione as pessoas responsáveis pelo acompanhamento deste ${
              tipoAtual === "pai" ? "objetivo" : "item"
            }.`}
            minCount={1}
          />

          <TarefaLinksField
            value={links}
            onChange={setLinks}
            disabled={readonly}
            label="Links"
            description="Adicione referências, documentos e materiais relacionados."
          />

          {!hideInternalSubmit ? (
            <div className="flex items-center justify-end pt-1">
              <button
                type={readonly ? "button" : "submit"}
                disabled={!readonly && submitting}
                className="button-primary inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium disabled:opacity-50"
              >
                {submitting ? "Salvando..." : resolvedSubmitLabel}
              </button>
            </div>
          ) : null}
        </form>
      </div>

      {modalCategoriaOpen ? (
        <div className="overlay-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="panel-theme w-full max-w-md rounded-[28px]">
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
                  Criar categoria
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>
                  A categoria será criada para a equipe selecionada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalCategoriaOpen(false);
                  setErroCategoria(null);
                  setNovaCategoriaNome("");
                  setNovaCategoriaDescricao("");
                }}
                className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <FieldLabel>Equipe</FieldLabel>
                <input
                  type="text"
                  value={equipes.find((item) => item.id === equipeId)?.nome ?? "Nenhuma equipe selecionada"}
                  disabled
                  className={inputClass(true)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                />
              </div>

              <div>
                <FieldLabel>Nome</FieldLabel>
                <input
                  type="text"
                  value={novaCategoriaNome}
                  onChange={(event) => setNovaCategoriaNome(event.target.value)}
                  className={inputClass(false)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  placeholder="Nome da categoria"
                />
              </div>

              <div>
                <FieldLabel>Descrição</FieldLabel>
                <textarea
                  value={novaCategoriaDescricao}
                  onChange={(event) => setNovaCategoriaDescricao(event.target.value)}
                  rows={3}
                  className={textAreaClass(false)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  placeholder="Descrição opcional"
                />
              </div>

              {erroCategoria ? (
                <div className="rounded-2xl px-4 py-3 text-sm status-danger">
                  {erroCategoria}
                </div>
              ) : null}
            </div>

            <div
              className="flex items-center justify-end gap-3 px-5 py-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setModalCategoriaOpen(false);
                  setErroCategoria(null);
                  setNovaCategoriaNome("");
                  setNovaCategoriaDescricao("");
                }}
                className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCriarCategoria}
                disabled={salvandoCategoria}
                className="button-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium disabled:opacity-50"
              >
                {salvandoCategoria ? "Salvando..." : "Salvar categoria"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
