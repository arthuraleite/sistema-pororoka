"use client";

import Image from "next/image";
import { CalendarDays, Clock3, FolderKanban, Tag, Users } from "lucide-react";
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

const escopoObjetivoOptions: Array<{ value: EscopoObjetivo; label: string }> = [
  { value: "global", label: "Objetivo global" },
  { value: "equipe", label: "Objetivo de equipe" },
];

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function inputClass(disabled = false) {
  return [
    "h-11 w-full rounded-xl px-3.5 text-sm outline-none transition",
    disabled ? "cursor-not-allowed opacity-60" : "",
  ].join(" ");
}

function textAreaClass(disabled = false) {
  return [
    "w-full rounded-2xl px-4 py-3 text-sm outline-none transition",
    disabled ? "cursor-not-allowed opacity-60" : "",
  ].join(" ");
}

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center gap-2 text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
      {icon ? <span style={{ color: "var(--text-4)" }}>{icon}</span> : null}
      <span>{children}</span>
    </label>
  );
}

function SelectedAvatar({ nome, avatarUrl, size = "sm" }: { nome: string; avatarUrl?: string | null; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "h-8 w-8 text-xs" : "h-7 w-7 text-[10px]";

  if (avatarUrl) {
    return (
      <span className={`relative overflow-hidden rounded-full ${sizeClass}`}>
        <Image src={avatarUrl} alt={nome} fill className="object-cover" sizes={size === "md" ? "32px" : "28px"} />
      </span>
    );
  }

  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-full font-semibold`}
      style={{ backgroundColor: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border)" }}
    >
      {iniciais(nome)}
    </span>
  );
}

function DropdownField({ label, icon, value, placeholder, open, onToggle, disabled, children }: { label: string; icon?: React.ReactNode; value?: string | null; placeholder: string; open: boolean; onToggle: () => void; disabled?: boolean; children?: React.ReactNode }) {
  return (
    <div className="relative">
      <FieldLabel icon={icon}>{label}</FieldLabel>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={inputClass(Boolean(disabled))}
        style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: value ? "var(--text-1)" : "var(--placeholder)" }}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="truncate">{value || placeholder}</span>
          <span style={{ color: "var(--text-4)" }}>{open ? "▴" : "▾"}</span>
        </span>
      </button>
      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function DropdownOption({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition interactive-surface" style={{ color: "var(--text-2)" }}>
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
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa | "">(initialValues?.prioridade ?? "");
  const [status, setStatus] = useState<StatusTarefa>(initialValues?.status ?? "a_fazer");
  const [dataEntrega, setDataEntrega] = useState(initialValues?.dataEntrega ?? "");
  const [horaEntrega, setHoraEntrega] = useState(initialValues?.horaEntrega ?? "");
  const [responsavelIds, setResponsavelIds] = useState<string[]>(initialValues?.responsavelIds ?? []);
  const [links, setLinks] = useState<LinkItem[]>(initialValues?.links ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [categoriasCriadasLocalmente, setCategoriasCriadasLocalmente] = useState<CategoriaTarefa[]>([]);
  const [categoriaBusca, setCategoriaBusca] = useState("");
  const [responsavelBusca, setResponsavelBusca] = useState("");
  const [mostrarEquipeMenu, setMostrarEquipeMenu] = useState(false);
  const [mostrarTarefaPaiMenu, setMostrarTarefaPaiMenu] = useState(false);
  const [mostrarPrioridadeMenu, setMostrarPrioridadeMenu] = useState(false);
  const [mostrarStatusMenu, setMostrarStatusMenu] = useState(false);
  const [mostrarCategoriaMenu, setMostrarCategoriaMenu] = useState(false);
  const [mostrarSugestoesResponsaveis, setMostrarSugestoesResponsaveis] = useState(false);
  const [mostrarEscopoMenu, setMostrarEscopoMenu] = useState(false);
  const [linksAbertos, setLinksAbertos] = useState((initialValues?.links?.length ?? 0) > 0);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [novaCategoriaDescricao, setNovaCategoriaDescricao] = useState("");
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

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
    return categoriasDaEquipe.filter((categoria) => categoria.nome.toLowerCase().includes(termo)).slice(0, 7);
  }, [categoriasDaEquipe, categoriaBusca]);

  const equipeSelecionada = useMemo(() => equipes.find((item) => item.id === equipeId) ?? null, [equipes, equipeId]);
  const tarefaPaiSelecionada = useMemo(() => tarefasPaiOptions.find((item) => item.id === tarefaPaiId) ?? null, [tarefasPaiOptions, tarefaPaiId]);
  const escopoSelecionado = useMemo(() => escopoObjetivoOptions.find((item) => item.value === escopoObjetivo) ?? null, [escopoObjetivo]);

  const usuariosElegiveis = useMemo(() => {
    if (tipoAtual === "pai") {
      return usuarios.filter((usuario) => ["admin_supremo", "coordenador_geral", "coordenador_equipe", "assistente", "gestor_financeiro"].includes(usuario.perfil));
    }
    return usuarios.filter((usuario) => usuario.perfil !== "analista_financeiro");
  }, [tipoAtual, usuarios]);

  const responsaveisSelecionados = useMemo(() => usuariosElegiveis.filter((usuario) => responsavelIds.includes(usuario.id)), [usuariosElegiveis, responsavelIds]);

  const sugestoesResponsaveis = useMemo(() => {
    const termo = responsavelBusca.trim().toLowerCase();
    return usuariosElegiveis
      .filter((usuario) => !responsavelIds.includes(usuario.id))
      .filter((usuario) => {
        if (!termo) return true;
        return usuario.nome.toLowerCase().includes(termo) || usuario.email.toLowerCase().includes(termo);
      })
      .slice(0, 6);
  }, [usuariosElegiveis, responsavelBusca, responsavelIds]);

  function adicionarResponsavel(usuarioId: string) {
    setResponsavelIds((current) => (current.includes(usuarioId) ? current : [...current, usuarioId]));
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
      const resultado = await criarCategoriaTarefa({ equipeId, nome: novaCategoriaNome.trim(), descricao: novaCategoriaDescricao.trim() || null });
      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível criar a categoria.");
      }
      setCategoriasCriadasLocalmente((current) => (current.some((item) => item.id === resultado.data?.id) ? current : [...current, resultado.data!]));
      setCategoriaId(resultado.data.id);
      setCategoriaBusca(resultado.data.nome);
      setNovaCategoriaNome("");
      setNovaCategoriaDescricao("");
      setModalCategoriaOpen(false);
      setMostrarCategoriaMenu(false);
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

    const linksNormalizados = links.map((link) => ({ ...link, url: link.url?.trim() ?? "", texto: link.texto?.trim() || null })).filter((link) => link.url !== "");
    setSubmitting(true);
    try {
      await onSubmit({
        tipo: tipoAtual,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        tarefaPaiId: tarefaPaiId || null,
        equipeId: tipoAtual === "pai" ? (escopoObjetivo === "equipe" ? equipeId || null : null) : equipeId || null,
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

  const resolvedSubmitLabel = submitLabel ?? (mode === "create" ? "Salvar" : mode === "edit" ? "Atualizar" : "Fechar");
  const mostrarCampoEquipe = allowEquipe && (tipoAtual !== "pai" || escopoObjetivo === "equipe");

  return (
    <>
      <div ref={containerRef}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {allowTipoSelector ? (
            <section className="rounded-[24px] p-4" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <FieldLabel>Tipo</FieldLabel>
              <select value={tipoAtual} onChange={(event) => setTipoAtual(event.target.value as TipoTarefa)} disabled={readonly} className={inputClass(readonly)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <option value="orfa">Órfã</option>
                <option value="filha">Filha</option>
                <option value="pai">Pai</option>
              </select>
            </section>
          ) : null}

          <section className="rounded-[24px] p-4 md:p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="space-y-5">
              <div>
                <FieldLabel>{tipoAtual === "pai" ? "Título do objetivo" : "Título"}</FieldLabel>
                <input type="text" value={titulo} onChange={(event) => setTitulo(event.target.value)} disabled={readonly} className={inputClass(readonly)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} placeholder={tipoAtual === "pai" ? "Ex.: Estruturar ciclo de mobilização" : "Título da tarefa"} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {tipoAtual === "pai" && allowEscopoObjetivo ? (
                  <DropdownField label="Escopo" icon={<Tag className="h-4 w-4" />} value={escopoSelecionado?.label ?? null} placeholder="Selecione o escopo" open={mostrarEscopoMenu && !readonly} onToggle={() => !readonly && setMostrarEscopoMenu((v) => !v)} disabled={readonly}>
                    <div className="max-h-56 overflow-y-auto p-1.5">
                      {escopoObjetivoOptions.filter((item) => (canSelectObjetivoGlobal ? true : item.value !== "global")).map((item) => (
                        <DropdownOption key={item.value} onClick={() => { setEscopoObjetivo(item.value); setMostrarEscopoMenu(false); }}>{item.label}</DropdownOption>
                      ))}
                    </div>
                  </DropdownField>
                ) : null}

                {tipoAtual === "filha" ? (
                  <DropdownField label="Objetivo-pai" icon={<FolderKanban className="h-4 w-4" />} value={tarefaPaiSelecionada?.titulo ?? null} placeholder="Selecione o objetivo" open={mostrarTarefaPaiMenu && !readonly} onToggle={() => !readonly && setMostrarTarefaPaiMenu((v) => !v)} disabled={readonly}>
                    <div className="max-h-56 overflow-y-auto p-1.5">
                      {tarefasPaiOptions.map((item) => (
                        <DropdownOption key={item.id} onClick={() => { setTarefaPaiId(item.id); setMostrarTarefaPaiMenu(false); }}>{item.titulo}</DropdownOption>
                      ))}
                    </div>
                  </DropdownField>
                ) : null}

                {allowProjeto && tipoAtual === "pai" ? (
                  <div>
                    <FieldLabel icon={<FolderKanban className="h-4 w-4" />}>Projeto</FieldLabel>
                    <input type="text" value={projetoId} onChange={(event) => setProjetoId(event.target.value)} disabled={readonly} className={inputClass(readonly)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} placeholder="Projeto vinculado" />
                  </div>
                ) : null}

                {mostrarCampoEquipe ? (
                  equipes.length <= 1 ? (
                    <div>
                      <FieldLabel icon={<Users className="h-4 w-4" />}>Equipe</FieldLabel>
                      <input type="text" value={equipeSelecionada?.nome ?? equipes[0]?.nome ?? ""} readOnly className={inputClass(true)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                    </div>
                  ) : (
                    <DropdownField label="Equipe" icon={<Users className="h-4 w-4" />} value={equipeSelecionada?.nome ?? null} placeholder="Selecione a equipe" open={mostrarEquipeMenu && !readonly && mode !== "edit"} onToggle={() => !readonly && mode !== "edit" && setMostrarEquipeMenu((v) => !v)} disabled={readonly || mode === "edit"}>
                      <div className="max-h-56 overflow-y-auto p-1.5">
                        {equipes.map((equipe) => (
                          <DropdownOption key={equipe.id} onClick={() => { setEquipeId(equipe.id); setCategoriaId(""); setCategoriaBusca(""); setMostrarEquipeMenu(false); }}>{equipe.nome}</DropdownOption>
                        ))}
                      </div>
                    </DropdownField>
                  )
                ) : null}

                {allowCategoria && tipoAtual !== "pai" ? (
                  <div className="relative">
                    <FieldLabel icon={<Tag className="h-4 w-4" />}>Categoria</FieldLabel>
                    <div className="relative">
                      <input type="text" value={categoriaBusca} onFocus={() => !readonly && equipeId && setMostrarCategoriaMenu(true)} onChange={(event) => { const value = event.target.value; setCategoriaBusca(value); if (!readonly && equipeId) setMostrarCategoriaMenu(true); if (!value.trim()) setCategoriaId(""); }} disabled={readonly || !equipeId} className={`${inputClass(readonly || !equipeId)} pr-28`} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} placeholder={equipeId ? "Buscar categoria" : "Selecione uma equipe primeiro"} />
                      <div className="pointer-events-none absolute inset-y-0 right-12 flex items-center text-xs" style={{ color: "var(--text-4)" }}>{mostrarCategoriaMenu ? "▴" : "▾"}</div>
                      <button type="button" onClick={() => { setNovaCategoriaNome(categoriaBusca.trim()); setModalCategoriaOpen(true); }} disabled={readonly || !equipeId} className="absolute right-1.5 top-1.5 inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-medium transition" style={{ backgroundColor: "var(--surface-0)", border: "1px solid var(--border)", color: "var(--text-2)" }}>+</button>
                    </div>
                    {mostrarCategoriaMenu && !readonly && equipeId ? (
                      <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
                        <div className="max-h-56 overflow-y-auto p-1.5">
                          {categoriasFiltradas.length > 0 ? categoriasFiltradas.map((categoria) => (
                            <button key={categoria.id} type="button" onClick={() => { setCategoriaId(categoria.id); setCategoriaBusca(categoria.nome); setMostrarCategoriaMenu(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition interactive-surface" style={{ color: "var(--text-2)" }}>
                              <span>{categoria.nome}</span>
                              {categoriaId === categoria.id ? <span className="text-[11px]" style={{ color: "var(--text-4)" }}>Selecionada</span> : null}
                            </button>
                          )) : <div className="px-3 py-3 text-sm" style={{ color: "var(--text-4)" }}>Nenhuma categoria encontrada.</div>}
                        </div>
                        <div className="p-2" style={{ borderTop: "1px solid var(--border)" }}>
                          <button type="button" onClick={() => { setNovaCategoriaNome(categoriaBusca.trim()); setModalCategoriaOpen(true); }} className="button-neutral inline-flex h-9 w-full items-center justify-center rounded-xl px-3 text-sm font-medium">Criar categoria +</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {allowPrioridade ? (
                  <DropdownField label="Prioridade" icon={<Tag className="h-4 w-4" />} value={prioridades.find((item) => item.value === prioridade)?.label ?? null} placeholder="Selecione a prioridade" open={mostrarPrioridadeMenu && !readonly} onToggle={() => !readonly && setMostrarPrioridadeMenu((v) => !v)} disabled={readonly}>
                    <div className="p-1.5">
                      {prioridades.map((item) => (
                        <DropdownOption key={item.value} onClick={() => { setPrioridade(item.value); setMostrarPrioridadeMenu(false); }}>{item.label}</DropdownOption>
                      ))}
                    </div>
                  </DropdownField>
                ) : null}

                {allowStatus ? (
                  <DropdownField label="Status" icon={<Tag className="h-4 w-4" />} value={statusOptions.find((item) => item.value === status)?.label ?? null} placeholder="Selecione o status" open={mostrarStatusMenu && !readonly} onToggle={() => !readonly && setMostrarStatusMenu((v) => !v)} disabled={readonly}>
                    <div className="p-1.5">
                      {statusOptions.map((item) => (
                        <DropdownOption key={item.value} onClick={() => { setStatus(item.value); setMostrarStatusMenu(false); }}>{item.label}</DropdownOption>
                      ))}
                    </div>
                  </DropdownField>
                ) : null}

                <div>
                  <FieldLabel icon={<CalendarDays className="h-4 w-4" />}>Data de entrega</FieldLabel>
                  <input type="date" value={dataEntrega} onChange={(event) => setDataEntrega(event.target.value)} disabled={readonly} className={inputClass(readonly)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                </div>

                <div>
                  <FieldLabel icon={<Clock3 className="h-4 w-4" />}>Hora de entrega</FieldLabel>
                  <input type="time" value={horaEntrega} onChange={(event) => setHoraEntrega(event.target.value)} disabled={readonly} className={inputClass(readonly)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                </div>
              </div>

              <div>
                <FieldLabel>Descrição</FieldLabel>
                <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} disabled={readonly} rows={6} className={textAreaClass(readonly)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} placeholder="Descreva o objetivo, contexto e entregáveis esperados." />
              </div>
            </div>
          </section>

          <section className="rounded-[24px] p-4 md:p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Responsáveis</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
                  Selecione as pessoas responsáveis pelo acompanhamento deste {tipoAtual === "pai" ? "objetivo" : "item"}.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="relative">
                <div className="flex h-11 items-center gap-2 rounded-xl px-3" style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)" }}>
                  <Users className="h-4 w-4" style={{ color: "var(--text-4)" }} />
                  <input type="text" value={responsavelBusca} onFocus={() => setMostrarSugestoesResponsaveis(true)} onChange={(event) => { setResponsavelBusca(event.target.value); setMostrarSugestoesResponsaveis(true); }} disabled={readonly} className="h-full w-full bg-transparent pl-1 text-sm outline-none placeholder:text-zinc-500 disabled:opacity-60" style={{ color: "var(--text-1)" }} placeholder="Buscar responsável" />
                </div>

                {mostrarSugestoesResponsaveis && !readonly ? (
                  <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
                    <div className="max-h-64 overflow-y-auto p-1.5">
                      {sugestoesResponsaveis.length > 0 ? sugestoesResponsaveis.map((usuario) => (
                        <button key={usuario.id} type="button" onClick={() => adicionarResponsavel(usuario.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition interactive-surface">
                          <SelectedAvatar nome={usuario.nome} avatarUrl={usuario.avatarUrl} size="md" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm" style={{ color: "var(--text-1)" }}>{usuario.nome}</span>
                            <span className="block truncate text-xs" style={{ color: "var(--text-4)" }}>{usuario.email}</span>
                          </span>
                        </button>
                      )) : <p className="px-3 py-3 text-sm" style={{ color: "var(--text-4)" }}>Nenhum usuário encontrado.</p>}
                    </div>
                  </div>
                ) : null}
              </div>

              {responsaveisSelecionados.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {responsaveisSelecionados.map((usuario) => (
                    <div key={usuario.id} className="flex items-center gap-2 rounded-full px-2.5 py-1.5" style={{ backgroundColor: "var(--surface-0)", border: "1px solid var(--border)" }}>
                      <SelectedAvatar nome={usuario.nome} avatarUrl={usuario.avatarUrl} size="sm" />
                      <span className="max-w-[160px] truncate text-sm" style={{ color: "var(--text-2)" }}>{usuario.nome}</span>
                      {!readonly ? (
                        <button type="button" onClick={() => removerResponsavel(usuario.id)} className="text-xs transition" style={{ color: "var(--text-4)" }}>×</button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-0)", color: "var(--text-4)" }}>
                  Nenhum responsável selecionado.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[24px] p-4 md:p-5" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Links</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>Adicione referências, documentos e materiais relacionados.</p>
              </div>
              <button type="button" onClick={() => setLinksAbertos((v) => !v)} className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium">
                {linksAbertos ? "Ocultar" : "Adicionar links"}
              </button>
            </div>

            {linksAbertos ? (
              <div className="mt-4">
                <TarefaLinksField value={links} onChange={setLinks} disabled={readonly} />
              </div>
            ) : links.length > 0 ? (
              <div className="mt-4 space-y-2">
                {links.map((item, index) => (
                  <a key={`${item.id ?? "novo"}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-2xl p-3 transition interactive-surface" style={{ backgroundColor: "var(--surface-0)", border: "1px solid var(--border)" }}>
                    <div className="truncate text-sm" style={{ color: "var(--text-1)" }}>{item.texto || item.url}</div>
                    <div className="mt-1 truncate text-xs" style={{ color: "var(--text-4)" }}>{item.url}</div>
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <div className="flex items-center justify-end pt-1">
            <button type={readonly ? "button" : "submit"} disabled={!readonly && submitting} className="button-primary inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium disabled:opacity-50">
              {submitting ? "Salvando..." : resolvedSubmitLabel}
            </button>
          </div>
        </form>
      </div>

      {modalCategoriaOpen ? (
        <div className="overlay-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="panel-theme w-full max-w-md rounded-[28px]">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>Criar categoria</h3>
                <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>A categoria será criada para a equipe selecionada.</p>
              </div>
              <button type="button" onClick={() => { setModalCategoriaOpen(false); setErroCategoria(null); }} className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium">Fechar</button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <FieldLabel>Equipe</FieldLabel>
                <input type="text" value={equipes.find((item) => item.id === equipeId)?.nome ?? "Nenhuma equipe selecionada"} disabled className={inputClass(true)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
              </div>
              <div>
                <FieldLabel>Nome</FieldLabel>
                <input type="text" value={novaCategoriaNome} onChange={(event) => setNovaCategoriaNome(event.target.value)} className={inputClass(false)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} placeholder="Nome da categoria" />
              </div>
              <div>
                <FieldLabel>Descrição</FieldLabel>
                <textarea value={novaCategoriaDescricao} onChange={(event) => setNovaCategoriaDescricao(event.target.value)} rows={3} className={textAreaClass(false)} style={{ backgroundColor: "var(--input)", border: "1px solid var(--border)", color: "var(--text-1)" }} placeholder="Descrição opcional" />
              </div>
              {erroCategoria ? <div className="rounded-2xl px-4 py-3 text-sm status-danger">{erroCategoria}</div> : null}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button type="button" onClick={() => { setModalCategoriaOpen(false); setErroCategoria(null); }} className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium">Cancelar</button>
              <button type="button" onClick={handleCriarCategoria} disabled={salvandoCategoria} className="button-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium disabled:opacity-50">{salvandoCategoria ? "Salvando..." : "Salvar categoria"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
