"use client";

import Image from "next/image";
import { Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { criarCategoriaTarefa } from "@/actions/tarefas/criar-categoria-tarefa";
import { TarefaLinksField } from "@/components/tarefas/tarefa-links-field";
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

const escopoObjetivoOptions: Array<{
  value: EscopoObjetivo;
  label: string;
}> = [
  { value: "global", label: "Objetivo global" },
  { value: "equipe", label: "Objetivo de equipe" },
];

const labelClassName = "text-[13px] font-medium text-zinc-300";
const fieldClassName =
  "h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-zinc-600 focus:ring-2 focus:ring-zinc-800 disabled:cursor-not-allowed disabled:opacity-60";
const textareaClassName =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-zinc-600 focus:ring-2 focus:ring-zinc-800 disabled:cursor-not-allowed disabled:opacity-60";
const triggerClassName =
  "flex h-11 w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3.5 text-left text-sm text-zinc-100 transition hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-800 disabled:cursor-not-allowed disabled:opacity-60";
const dropdownClassName =
  "absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl";
const dropdownButtonClassName =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-900";

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function SelectedAvatar({
  nome,
  avatarUrl,
  size = "sm",
}: {
  nome: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]";

  if (avatarUrl) {
    return (
      <span className={`relative overflow-hidden rounded-full ${sizeClass}`}>
        <Image
          src={avatarUrl}
          alt={nome}
          fill
          className="object-cover"
          sizes={size === "md" ? "32px" : "24px"}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-zinc-800 font-semibold text-zinc-200`}
    >
      {iniciais(nome)}
    </span>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  open,
  onToggle,
  disabled,
  compact = false,
  children,
}: {
  label: string;
  value?: string | null;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative ${compact ? "space-y-1" : "space-y-1.5"}`}>
      <label className={labelClassName}>{label}</label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={triggerClassName}
      >
        <span className={value ? "text-zinc-100" : "text-zinc-500"}>
          {value || placeholder}
        </span>
        <span className="text-xs text-zinc-500">{open ? "▴" : "▾"}</span>
      </button>
      {open ? <div className={dropdownClassName}>{children}</div> : null}
    </div>
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
  const [responsavelBusca, setResponsavelBusca] = useState("");
  const [mostrarEquipeMenu, setMostrarEquipeMenu] = useState(false);
  const [mostrarTarefaPaiMenu, setMostrarTarefaPaiMenu] = useState(false);
  const [mostrarPrioridadeMenu, setMostrarPrioridadeMenu] = useState(false);
  const [mostrarStatusMenu, setMostrarStatusMenu] = useState(false);
  const [mostrarCategoriaMenu, setMostrarCategoriaMenu] = useState(false);
  const [mostrarSugestoesResponsaveis, setMostrarSugestoesResponsaveis] =
    useState(false);
  const [mostrarEscopoMenu, setMostrarEscopoMenu] = useState(false);

  const [linksAbertos, setLinksAbertos] = useState(
    (initialValues?.links?.length ?? 0) > 0,
  );

  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [novaCategoriaDescricao, setNovaCategoriaDescricao] = useState("");
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      tipoAtual === "pai" &&
      !canSelectObjetivoGlobal &&
      escopoObjetivo !== "equipe"
    ) {
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
  }, [
    allowEquipe,
    tipoAtual,
    escopoObjetivo,
    readonly,
    mode,
    equipeId,
    equipes,
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMostrarEquipeMenu(false);
        setMostrarTarefaPaiMenu(false);
        setMostrarPrioridadeMenu(false);
        setMostrarStatusMenu(false);
        setMostrarCategoriaMenu(false);
        setMostrarSugestoesResponsaveis(false);
        setMostrarEscopoMenu(false);
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

  const categoriasFiltradas = useMemo(() => {
    const termo = categoriaBusca.trim().toLowerCase();
    if (!termo) return categoriasDaEquipe.slice(0, 7);

    return categoriasDaEquipe
      .filter((categoria) => categoria.nome.toLowerCase().includes(termo))
      .slice(0, 7);
  }, [categoriasDaEquipe, categoriaBusca]);

  const equipeSelecionada = useMemo(
    () => equipes.find((item) => item.id === equipeId) ?? null,
    [equipes, equipeId],
  );

  const tarefaPaiSelecionada = useMemo(
    () => tarefasPaiOptions.find((item) => item.id === tarefaPaiId) ?? null,
    [tarefasPaiOptions, tarefaPaiId],
  );

  const escopoSelecionado = useMemo(
    () =>
      escopoObjetivoOptions.find((item) => item.value === escopoObjetivo) ?? null,
    [escopoObjetivo],
  );

  const usuariosElegiveis = useMemo(() => {
    if (tipoAtual === "pai") {
      return usuarios.filter((usuario) =>
        [
          "admin_supremo",
          "coordenador_geral",
          "coordenador_equipe",
          "assistente",
          "gestor_financeiro",
        ].includes(usuario.perfil),
      );
    }

    return usuarios.filter((usuario) => usuario.perfil !== "analista_financeiro");
  }, [tipoAtual, usuarios]);

  const responsaveisSelecionados = useMemo(
    () => usuariosElegiveis.filter((usuario) => responsavelIds.includes(usuario.id)),
    [usuariosElegiveis, responsavelIds],
  );

  const sugestoesResponsaveis = useMemo(() => {
    const termo = responsavelBusca.trim().toLowerCase();

    return usuariosElegiveis
      .filter((usuario) => !responsavelIds.includes(usuario.id))
      .filter((usuario) => {
        if (!termo) return true;
        return (
          usuario.nome.toLowerCase().includes(termo) ||
          usuario.email.toLowerCase().includes(termo)
        );
      })
      .slice(0, 6);
  }, [usuariosElegiveis, responsavelBusca, responsavelIds]);

  function adicionarResponsavel(usuarioId: string) {
    setResponsavelIds((current) =>
      current.includes(usuarioId) ? current : [...current, usuarioId],
    );
    setResponsavelBusca("");
    setMostrarSugestoesResponsaveis(false);
  }

  function removerResponsavel(usuarioId: string) {
    setResponsavelIds((current) => current.filter((id) => id !== usuarioId));
  }

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

      setCategoriasCriadasLocalmente((current) => {
        const existe = current.some((item) => item.id === resultado.data?.id);
        return existe ? current : [...current, resultado.data!];
      });

      setCategoriaId(resultado.data.id);
      setCategoriaBusca(resultado.data.nome);
      setNovaCategoriaNome("");
      setNovaCategoriaDescricao("");
      setModalCategoriaOpen(false);
      setMostrarCategoriaMenu(false);
    } catch (error) {
      setErroCategoria(
        error instanceof Error ? error.message : "Erro ao criar categoria.",
      );
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
    submitLabel ??
    (mode === "create" ? "Salvar" : mode === "edit" ? "Atualizar" : "Fechar");

  const mostrarCampoEquipe =
    allowEquipe && (tipoAtual !== "pai" || escopoObjetivo === "equipe");

  return (
    <>
      <div ref={containerRef}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-4">
            {allowTipoSelector ? (
              <div className="space-y-1.5">
                <label className={labelClassName}>Tipo</label>
                <select
                  value={tipoAtual}
                  onChange={(event) => setTipoAtual(event.target.value as TipoTarefa)}
                  disabled={readonly}
                  className={fieldClassName}
                >
                  <option value="orfa">Órfã</option>
                  <option value="filha">Filha</option>
                  <option value="pai">Pai</option>
                </select>
              </div>
            ) : null}

            {tipoAtual === "pai" && allowEscopoObjetivo ? (
              <DropdownField
                label="Escopo do objetivo"
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
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setEscopoObjetivo(item.value);
                          setMostrarEscopoMenu(false);
                        }}
                        className={dropdownButtonClassName}
                      >
                        {item.label}
                      </button>
                    ))}
                </div>
              </DropdownField>
            ) : null}

            {tipoAtual === "filha" ? (
              <DropdownField
                label="Objetivo-pai"
                value={tarefaPaiSelecionada?.titulo ?? null}
                placeholder="Selecione o objetivo"
                open={mostrarTarefaPaiMenu && !readonly}
                onToggle={() => !readonly && setMostrarTarefaPaiMenu((v) => !v)}
                disabled={readonly}
              >
                <div className="max-h-56 overflow-y-auto p-1.5">
                  {tarefasPaiOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTarefaPaiId(item.id);
                        setMostrarTarefaPaiMenu(false);
                      }}
                      className={dropdownButtonClassName}
                    >
                      {item.titulo}
                    </button>
                  ))}
                </div>
              </DropdownField>
            ) : null}

            <div className="space-y-1.5">
              <label className={labelClassName}>Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                disabled={readonly}
                className={fieldClassName}
                placeholder={tipoAtual === "pai" ? "Título do objetivo" : "Título da tarefa"}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClassName}>Descrição</label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                disabled={readonly}
                rows={3}
                className={textareaClassName}
                placeholder="Descrição opcional"
              />
            </div>

            {allowProjeto && tipoAtual === "pai" ? (
              <div className="space-y-1.5">
                <label className={labelClassName}>Projeto ID</label>
                <input
                  type="text"
                  value={projetoId}
                  onChange={(event) => setProjetoId(event.target.value)}
                  disabled={readonly}
                  className={fieldClassName}
                  placeholder="Opcional"
                />
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {mostrarCampoEquipe ? (
                equipes.length <= 1 ? (
                  <div className="space-y-1.5">
                    <label className={labelClassName}>Equipe</label>
                    <input
                      type="text"
                      value={equipeSelecionada?.nome ?? equipes[0]?.nome ?? ""}
                      readOnly
                      className={fieldClassName}
                    />
                  </div>
                ) : (
                  <DropdownField
                    label="Equipe"
                    value={equipeSelecionada?.nome ?? null}
                    placeholder="Selecione a equipe"
                    open={mostrarEquipeMenu && !readonly && mode !== "edit"}
                    onToggle={() =>
                      !readonly && mode !== "edit" && setMostrarEquipeMenu((v) => !v)
                    }
                    disabled={readonly || mode === "edit"}
                    compact
                  >
                    <div className="max-h-56 overflow-y-auto p-1.5">
                      {equipes.map((equipe) => (
                        <button
                          key={equipe.id}
                          type="button"
                          onClick={() => {
                            setEquipeId(equipe.id);
                            setCategoriaId("");
                            setCategoriaBusca("");
                            setMostrarEquipeMenu(false);
                          }}
                          className={dropdownButtonClassName}
                        >
                          {equipe.nome}
                        </button>
                      ))}
                    </div>
                  </DropdownField>
                )
              ) : null}

              {allowCategoria && tipoAtual !== "pai" ? (
                <div className="relative space-y-1.5">
                  <label className={labelClassName}>Categoria</label>

                  <div className="relative">
                    <input
                      type="text"
                      value={categoriaBusca}
                      onFocus={() => !readonly && equipeId && setMostrarCategoriaMenu(true)}
                      onChange={(event) => {
                        const value = event.target.value;
                        setCategoriaBusca(value);

                        if (!readonly && equipeId) {
                          setMostrarCategoriaMenu(true);
                        }

                        if (!value.trim()) {
                          setCategoriaId("");
                        }
                      }}
                      disabled={readonly || !equipeId}
                      className={`${fieldClassName} pr-28`}
                      placeholder={
                        equipeId ? "Buscar categoria" : "Selecione uma equipe primeiro"
                      }
                    />

                    <div className="pointer-events-none absolute inset-y-0 right-12 flex items-center text-xs text-zinc-500">
                      {mostrarCategoriaMenu ? "▴" : "▾"}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNovaCategoriaNome(categoriaBusca.trim());
                        setModalCategoriaOpen(true);
                      }}
                      disabled={readonly || !equipeId}
                      className="absolute right-1.5 top-1.5 inline-flex h-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  {mostrarCategoriaMenu && !readonly && equipeId ? (
                    <div className={dropdownClassName}>
                      <div className="max-h-56 overflow-y-auto p-1.5">
                        {categoriasFiltradas.length > 0 ? (
                          categoriasFiltradas.map((categoria) => (
                            <button
                              key={categoria.id}
                              type="button"
                              onClick={() => {
                                setCategoriaId(categoria.id);
                                setCategoriaBusca(categoria.nome);
                                setMostrarCategoriaMenu(false);
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-900"
                            >
                              <span>{categoria.nome}</span>
                              {categoriaId === categoria.id ? (
                                <span className="text-[11px] text-zinc-500">Selecionada</span>
                              ) : null}
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-3">
                            <p className="text-sm text-zinc-500">Nenhuma categoria encontrada.</p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-zinc-800 p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNovaCategoriaNome(categoriaBusca.trim());
                            setModalCategoriaOpen(true);
                          }}
                          className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                        >
                          Criar Categoria +
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {allowPrioridade ? (
                <DropdownField
                  label="Prioridade"
                  value={prioridades.find((item) => item.value === prioridade)?.label ?? null}
                  placeholder="Selecione a prioridade"
                  open={mostrarPrioridadeMenu && !readonly}
                  onToggle={() => !readonly && setMostrarPrioridadeMenu((v) => !v)}
                  disabled={readonly}
                  compact
                >
                  <div className="p-1.5">
                    {prioridades.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setPrioridade(item.value);
                          setMostrarPrioridadeMenu(false);
                        }}
                        className={dropdownButtonClassName}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </DropdownField>
              ) : null}

              {allowStatus ? (
                <DropdownField
                  label="Status"
                  value={statusOptions.find((item) => item.value === status)?.label ?? null}
                  placeholder="Selecione o status"
                  open={mostrarStatusMenu && !readonly}
                  onToggle={() => !readonly && setMostrarStatusMenu((v) => !v)}
                  disabled={readonly}
                  compact
                >
                  <div className="p-1.5">
                    {statusOptions.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setStatus(item.value);
                          setMostrarStatusMenu(false);
                        }}
                        className={dropdownButtonClassName}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </DropdownField>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClassName}>Data de entrega</label>
                <input
                  type="date"
                  value={dataEntrega}
                  onChange={(event) => setDataEntrega(event.target.value)}
                  disabled={readonly}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClassName}>Hora de entrega</label>
                <input
                  type="time"
                  value={horaEntrega}
                  onChange={(event) => setHoraEntrega(event.target.value)}
                  disabled={readonly}
                  className={fieldClassName}
                />
              </div>
            </div>
          </section>

          <section className="space-y-1.5">
            <label className={labelClassName}>Responsáveis</label>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
              <div className="relative">
                <div className="flex h-11 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3">
                  <Users className="h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={responsavelBusca}
                    onFocus={() => setMostrarSugestoesResponsaveis(true)}
                    onChange={(event) => {
                      setResponsavelBusca(event.target.value);
                      setMostrarSugestoesResponsaveis(true);
                    }}
                    disabled={readonly}
                    className="h-full w-full bg-transparent pl-1 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:opacity-60"
                    placeholder="Buscar responsável"
                  />
                </div>

                {mostrarSugestoesResponsaveis && !readonly ? (
                  <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
                    <div className="max-h-56 overflow-y-auto p-1.5">
                      {sugestoesResponsaveis.length > 0 ? (
                        sugestoesResponsaveis.map((usuario) => (
                          <button
                            key={usuario.id}
                            type="button"
                            onClick={() => adicionarResponsavel(usuario.id)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-zinc-900"
                          >
                            <SelectedAvatar
                              nome={usuario.nome}
                              avatarUrl={usuario.avatarUrl}
                              size="md"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-zinc-100">
                                {usuario.nome}
                              </span>
                              <span className="block truncate text-xs text-zinc-500">
                                {usuario.email}
                              </span>
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-3 text-sm text-zinc-500">
                          Nenhum usuário encontrado.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {responsaveisSelecionados.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {responsaveisSelecionados.map((usuario) => (
                    <div
                      key={usuario.id}
                      className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1.5"
                    >
                      <SelectedAvatar
                        nome={usuario.nome}
                        avatarUrl={usuario.avatarUrl}
                        size="sm"
                      />
                      <span className="max-w-[140px] truncate text-sm text-zinc-200">
                        {usuario.nome}
                      </span>
                      {!readonly ? (
                        <button
                          type="button"
                          onClick={() => removerResponsavel(usuario.id)}
                          className="text-xs text-zinc-400 transition hover:text-zinc-200"
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-medium text-zinc-100">Links</h4>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Adicione links externos relacionados à tarefa.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLinksAbertos((v) => !v)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900"
              >
                {linksAbertos ? "Ocultar" : "Adicionar links"}
              </button>
            </div>

            {linksAbertos ? (
              <div className="pt-2">
                <TarefaLinksField
                  value={links}
                  onChange={setLinks}
                  disabled={readonly}
                />
              </div>
            ) : null}
          </section>

          <div className="flex items-center justify-end pt-1">
            <button
              type={readonly ? "button" : "submit"}
              disabled={!readonly && submitting}
              className="inline-flex h-11 items-center rounded-xl bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {submitting ? "Salvando..." : resolvedSubmitLabel}
            </button>
          </div>
        </form>
      </div>

      {modalCategoriaOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">
                  Criar categoria
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  A categoria será criada para a equipe selecionada.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalCategoriaOpen(false);
                  setErroCategoria(null);
                }}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-1.5">
                <label className={labelClassName}>Equipe</label>
                <input
                  type="text"
                  value={
                    equipes.find((item) => item.id === equipeId)?.nome ??
                    "Nenhuma equipe selecionada"
                  }
                  disabled
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClassName}>Nome</label>
                <input
                  type="text"
                  value={novaCategoriaNome}
                  onChange={(event) => setNovaCategoriaNome(event.target.value)}
                  className={fieldClassName}
                  placeholder="Nome da categoria"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClassName}>Descrição</label>
                <textarea
                  value={novaCategoriaDescricao}
                  onChange={(event) => setNovaCategoriaDescricao(event.target.value)}
                  rows={3}
                  className={textareaClassName}
                  placeholder="Descrição opcional"
                />
              </div>

              {erroCategoria ? (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                  {erroCategoria}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setModalCategoriaOpen(false);
                  setErroCategoria(null);
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCriarCategoria}
                disabled={salvandoCategoria}
                className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
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
