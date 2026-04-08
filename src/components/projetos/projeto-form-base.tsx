"use client";

import { CalendarDays, DollarSign, FolderKanban, Plus, Search, Tag, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type {
  FinanciadorProjetoOption,
  ProjetoFormData,
  TipoProjeto,
  UsuarioCoordenadorProjetoOption,
} from "@/types/projetos/projetos.types";

type RubricaGlobalOption = {
  id: string;
  nome: string;
};

type ObjetivoResumo = {
  id: string;
  titulo: string;
  status: string;
  data_entrega: string;
  hora_entrega: string | null;
};

type Props = {
  mode: "create" | "edit" | "view";
  projetoId?: string | null;
  initialValues?: Partial<ProjetoFormData> & { id?: string };
  coordenadores: UsuarioCoordenadorProjetoOption[];
  financiadores: FinanciadorProjetoOption[];
  rubricasGlobais: RubricaGlobalOption[];
  objetivos?: ObjetivoResumo[];
  onSubmit?: (values: ProjetoFormData) => void | Promise<void>;
  onTituloChange?: (titulo: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onCriarFinanciador?: (nome: string) => Promise<FinanciadorProjetoOption | null>;
  onCriarRubricaGlobal?: (nome: string) => Promise<RubricaGlobalOption | null>;
  onAbrirTarefasProjeto?: (projetoId: string) => void;
  formId?: string;
  hideInternalSubmit?: boolean;
  submitLabel?: string;
};

type FormErrors = Partial<{
  tipo: string;
  nome: string;
  sigla: string;
  coordenador_id: string;
  data_inicio: string;
  financiador_id: string;
  orcamento_total: string;
  rubricas: string;
  links: string;
}>;

type LinkFormState = {
  idLocal: string;
  titulo: string;
  url: string;
};

type RubricaFormState = {
  idLocal: string;
  rubrica_global_id: string;
  limite_teto_gasto: string;
};

function gerarIdLocal(prefixo: string) {
  return `${prefixo}_${Math.random().toString(36).slice(2, 10)}`;
}

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

function sectionClass() {
  return "rounded-[24px] p-4 md:p-5";
}

function formatarStatusObjetivo(status: string) {
  switch (status) {
    case "a_fazer":
      return "A fazer";
    case "em_andamento":
      return "Em andamento";
    case "atencao":
      return "Atenção";
    case "em_atraso":
      return "Em atraso";
    case "em_pausa":
      return "Em pausa";
    case "concluida":
      return "Concluída";
    default:
      return status;
  }
}

function normalizarNumeroMoeda(valor: string) {
  const limpo = valor.replace(/\./g, "").replace(",", ".").trim();

  if (!limpo) return null;

  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

function formatarNumero(valor: number | null | undefined) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatarDataPtBr(dataIso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR").format(
      new Date(`${dataIso}T00:00:00`),
    );
  } catch {
    return dataIso;
  }
}

function FieldLabel({
  icon,
  children,
  required = false,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      className="mb-2 flex items-center gap-2 text-sm font-medium"
      style={{ color: "var(--text-2)" }}
    >
      {icon ? <span style={{ color: "var(--text-4)" }}>{icon}</span> : null}
      <span>{children}</span>
      {required ? <span style={{ color: "#fca5a5" }}>*</span> : null}
    </label>
  );
}

function ObjetivoItem({
  objetivo,
}: {
  objetivo: ObjetivoResumo;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        backgroundColor: "var(--surface-0)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" style={{ color: "var(--text-1)" }}>
            {objetivo.titulo}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
            Prazo: {formatarDataPtBr(objetivo.data_entrega)}
            {objetivo.hora_entrega ? ` às ${objetivo.hora_entrega}` : ""}
          </p>
        </div>

        <span
          className="inline-flex rounded-full px-3 py-1 text-[11px] font-medium"
          style={{
            backgroundColor: "var(--surface-3)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          {formatarStatusObjetivo(objetivo.status)}
        </span>
      </div>
    </div>
  );
}

export function ProjetoFormBase({
  mode,
  projetoId,
  initialValues,
  coordenadores,
  financiadores,
  rubricasGlobais,
  objetivos = [],
  onSubmit,
  onTituloChange,
  onDirtyChange,
  onCriarFinanciador,
  onCriarRubricaGlobal,
  onAbrirTarefasProjeto,
  formId,
  hideInternalSubmit = false,
  submitLabel,
}: Props) {
  const readonly = mode === "view";

  const [tipo, setTipo] = useState<TipoProjeto>(initialValues?.tipo ?? "interno");
  const [nome, setNome] = useState(initialValues?.nome ?? "");
  const [sigla, setSigla] = useState(initialValues?.sigla ?? "");
  const [resumo, setResumo] = useState(initialValues?.resumo ?? "");
  const [coordenadorId, setCoordenadorId] = useState(initialValues?.coordenador_id ?? "");
  const [dataInicio, setDataInicio] = useState(initialValues?.data_inicio ?? "");
  const [dataFim, setDataFim] = useState(initialValues?.data_fim ?? "");
  const [financiadorId, setFinanciadorId] = useState(initialValues?.financiador_id ?? "");
  const [orcamentoTotal, setOrcamentoTotal] = useState(
    formatarNumero(initialValues?.orcamento_total ?? null),
  );
  const [observacoes, setObservacoes] = useState(initialValues?.observacoes ?? "");
  const [links, setLinks] = useState<LinkFormState[]>(
    (initialValues?.links ?? []).map((item) => ({
      idLocal: gerarIdLocal("link"),
      titulo: item.titulo,
      url: item.url,
    })),
  );
  const [rubricas, setRubricas] = useState<RubricaFormState[]>(
    (initialValues?.rubricas ?? []).map((item) => ({
      idLocal: gerarIdLocal("rubrica"),
      rubrica_global_id: item.rubrica_global_id,
      limite_teto_gasto: formatarNumero(item.limite_teto_gasto),
    })),
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [buscaRubrica, setBuscaRubrica] = useState("");
  const [novoFinanciadorNome, setNovoFinanciadorNome] = useState("");
  const [novaRubricaNome, setNovaRubricaNome] = useState("");
  const [criandoFinanciador, setCriandoFinanciador] = useState(false);
  const [criandoRubrica, setCriandoRubrica] = useState(false);

  const totalRubricas = useMemo(() => {
    return rubricas.reduce((acc, item) => {
      const valor = normalizarNumeroMoeda(item.limite_teto_gasto);
      return acc + (valor ?? 0);
    }, 0);
  }, [rubricas]);

  const rubricasDisponiveis = useMemo(() => {
    const idsSelecionados = new Set(
      rubricas.map((item) => item.rubrica_global_id).filter(Boolean),
    );
    const termo = buscaRubrica.trim().toLowerCase();

    return rubricasGlobais.filter((item) => {
      if (idsSelecionados.has(item.id)) return false;
      if (!termo) return true;
      return item.nome.toLowerCase().includes(termo);
    });
  }, [rubricasGlobais, rubricas, buscaRubrica]);

  useEffect(() => {
    onTituloChange?.(nome);
  }, [nome, onTituloChange]);

  useEffect(() => {
    const initialLinks = JSON.stringify(
      (initialValues?.links ?? []).map((item) => ({
        titulo: item.titulo,
        url: item.url,
      })),
    );

    const currentLinks = JSON.stringify(
      links.map((item) => ({
        titulo: item.titulo,
        url: item.url,
      })),
    );

    const initialRubricas = JSON.stringify(
      (initialValues?.rubricas ?? []).map((item) => ({
        rubrica_global_id: item.rubrica_global_id,
        limite_teto_gasto: item.limite_teto_gasto,
      })),
    );

    const currentRubricas = JSON.stringify(
      rubricas.map((item) => ({
        rubrica_global_id: item.rubrica_global_id,
        limite_teto_gasto: normalizarNumeroMoeda(item.limite_teto_gasto),
      })),
    );

    const dirty =
      (initialValues?.tipo ?? "interno") !== tipo ||
      (initialValues?.nome ?? "") !== nome ||
      (initialValues?.sigla ?? "") !== sigla ||
      (initialValues?.resumo ?? "") !== resumo ||
      (initialValues?.coordenador_id ?? "") !== coordenadorId ||
      (initialValues?.data_inicio ?? "") !== dataInicio ||
      (initialValues?.data_fim ?? "") !== dataFim ||
      (initialValues?.financiador_id ?? "") !== financiadorId ||
      (initialValues?.orcamento_total ?? null) !== normalizarNumeroMoeda(orcamentoTotal) ||
      (initialValues?.observacoes ?? "") !== observacoes ||
      initialLinks !== currentLinks ||
      initialRubricas !== currentRubricas;

    onDirtyChange?.(dirty);
  }, [
    tipo,
    nome,
    sigla,
    resumo,
    coordenadorId,
    dataInicio,
    dataFim,
    financiadorId,
    orcamentoTotal,
    observacoes,
    links,
    rubricas,
    initialValues,
    onDirtyChange,
  ]);

  useEffect(() => {
    if (tipo === "interno") {
      setFinanciadorId("");
      setOrcamentoTotal("");
      setRubricas([]);
      setErrors((current) => ({
        ...current,
        financiador_id: undefined,
        orcamento_total: undefined,
        rubricas: undefined,
      }));
    }
  }, [tipo]);

  function validarFormulario() {
    const nextErrors: FormErrors = {};

    if (!nome.trim()) nextErrors.nome = "Informe o nome do projeto.";
    if (!sigla.trim()) nextErrors.sigla = "Informe a sigla do projeto.";
    if (!coordenadorId) nextErrors.coordenador_id = "Selecione o coordenador.";
    if (!dataInicio) nextErrors.data_inicio = "Informe a data de início.";

    if (tipo === "financiado") {
      if (!financiadorId) {
        nextErrors.financiador_id = "Selecione o financiador.";
      }

      const orcamentoNumero = normalizarNumeroMoeda(orcamentoTotal);
      if (orcamentoNumero === null || orcamentoNumero <= 0) {
        nextErrors.orcamento_total = "Informe um orçamento total válido.";
      }

      if (rubricas.length === 0) {
        nextErrors.rubricas = "Adicione ao menos uma rubrica.";
      } else if (orcamentoNumero !== null && totalRubricas !== orcamentoNumero) {
        nextErrors.rubricas =
          "A soma dos tetos das rubricas deve ser exatamente igual ao orçamento total.";
      }
    }

    if (links.length > 10) {
      nextErrors.links = "O projeto pode ter no máximo 10 links.";
    }

    const linkInvalido = links.some(
      (item) => !item.titulo.trim() || !item.url.trim(),
    );

    if (linkInvalido) {
      nextErrors.links = "Todos os links devem ter título e URL.";
    }

    return nextErrors;
  }

  function adicionarLink() {
    if (readonly) return;
    if (links.length >= 10) return;

    setLinks((current) => [
      ...current,
      {
        idLocal: gerarIdLocal("link"),
        titulo: "",
        url: "",
      },
    ]);
  }

  function atualizarLink(idLocal: string, campo: "titulo" | "url", valor: string) {
    setLinks((current) =>
      current.map((item) =>
        item.idLocal === idLocal ? { ...item, [campo]: valor } : item,
      ),
    );
    setErrors((current) => ({ ...current, links: undefined }));
  }

  function removerLink(idLocal: string) {
    if (readonly) return;
    setLinks((current) => current.filter((item) => item.idLocal !== idLocal));
  }

  function adicionarRubrica(rubricaGlobalId: string) {
    if (readonly || !rubricaGlobalId) return;

    setRubricas((current) => [
      ...current,
      {
        idLocal: gerarIdLocal("rubrica"),
        rubrica_global_id: rubricaGlobalId,
        limite_teto_gasto: "",
      },
    ]);
    setBuscaRubrica("");
    setErrors((current) => ({ ...current, rubricas: undefined }));
  }

  function atualizarRubrica(
    idLocal: string,
    campo: "rubrica_global_id" | "limite_teto_gasto",
    valor: string,
  ) {
    setRubricas((current) =>
      current.map((item) =>
        item.idLocal === idLocal ? { ...item, [campo]: valor } : item,
      ),
    );
    setErrors((current) => ({ ...current, rubricas: undefined }));
  }

  function removerRubrica(idLocal: string) {
    if (readonly) return;
    setRubricas((current) => current.filter((item) => item.idLocal !== idLocal));
  }

  async function handleCriarFinanciador() {
    if (!onCriarFinanciador || !novoFinanciadorNome.trim()) return;

    try {
      setCriandoFinanciador(true);
      const novo = await onCriarFinanciador(novoFinanciadorNome.trim());

      if (novo) {
        setFinanciadorId(novo.id);
        setNovoFinanciadorNome("");
        setErrors((current) => ({ ...current, financiador_id: undefined }));
      }
    } finally {
      setCriandoFinanciador(false);
    }
  }

  async function handleCriarRubricaGlobal() {
    if (!onCriarRubricaGlobal || !novaRubricaNome.trim()) return;

    try {
      setCriandoRubrica(true);
      const nova = await onCriarRubricaGlobal(novaRubricaNome.trim());

      if (nova) {
        adicionarRubrica(nova.id);
        setNovaRubricaNome("");
      }
    } finally {
      setCriandoRubrica(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readonly || !onSubmit) return;

    const nextErrors = validarFormulario();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: ProjetoFormData = {
        tipo,
        status: initialValues?.status ?? "a_iniciar",
        nome: nome.trim(),
        sigla: sigla.trim(),
        resumo: resumo.trim() || null,
        coordenador_id: coordenadorId,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        financiador_id: tipo === "financiado" ? financiadorId || null : null,
        orcamento_total:
            tipo === "financiado" ? normalizarNumeroMoeda(orcamentoTotal) : null,
        observacoes: observacoes.trim() || null,
        links: links.map((item) => ({
            titulo: item.titulo.trim(),
            url: item.url.trim(),
        })),
        rubricas:
            tipo === "financiado"
            ? rubricas.map((item) => ({
                rubrica_global_id: item.rubrica_global_id,
                limite_teto_gasto: normalizarNumeroMoeda(item.limite_teto_gasto),
                }))
            : [],
        };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  const submitText =
    submitLabel ??
    (mode === "create"
      ? "Salvar projeto"
      : mode === "edit"
        ? "Salvar alterações"
        : "Fechar");

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      <section
        className={sectionClass()}
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-5">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
            Dados gerais
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>
            Identificação principal, coordenação e cronologia do projeto.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <FieldLabel icon={<Tag className="h-4 w-4" />} required>
              Tipo
            </FieldLabel>
            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value as TipoProjeto)}
              disabled={readonly}
              className={inputClass(readonly)}
              style={{
                backgroundColor: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            >
              <option value="interno">Interno</option>
              <option value="financiado">Financiado</option>
            </select>
          </div>

          <div className="md:col-span-1 xl:col-span-2">
            <FieldLabel icon={<FolderKanban className="h-4 w-4" />} required>
              Nome do projeto
            </FieldLabel>
            <input
              type="text"
              value={nome}
              onChange={(event) => {
                setNome(event.target.value);
                setErrors((current) => ({ ...current, nome: undefined }));
              }}
              disabled={readonly}
              className={inputClass(readonly)}
              style={{
                backgroundColor: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              placeholder="Nome do projeto"
            />
            {errors.nome ? (
              <p className="mt-2 text-xs" style={{ color: "#fca5a5" }}>
                {errors.nome}
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel required>Sigla</FieldLabel>
            <input
              type="text"
              value={sigla}
              onChange={(event) => {
                setSigla(event.target.value);
                setErrors((current) => ({ ...current, sigla: undefined }));
              }}
              disabled={readonly}
              className={inputClass(readonly)}
              style={{
                backgroundColor: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              placeholder="Ex.: COP30"
            />
            {errors.sigla ? (
              <p className="mt-2 text-xs" style={{ color: "#fca5a5" }}>
                {errors.sigla}
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <FieldLabel>Resumo</FieldLabel>
            <textarea
              rows={3}
              value={resumo}
              onChange={(event) => setResumo(event.target.value)}
              disabled={readonly}
              className={textAreaClass(readonly)}
              style={{
                backgroundColor: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
              placeholder="Resumo executivo do projeto"
            />
          </div>

          <div>
            <FieldLabel icon={<Users className="h-4 w-4" />} required>
              Coordenador
            </FieldLabel>
            <select
              value={coordenadorId}
              onChange={(event) => {
                setCoordenadorId(event.target.value);
                setErrors((current) => ({ ...current, coordenador_id: undefined }));
              }}
              disabled={readonly}
              className={inputClass(readonly)}
              style={{
                backgroundColor: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            >
              <option value="">Selecione</option>
              {coordenadores.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            {errors.coordenador_id ? (
              <p className="mt-2 text-xs" style={{ color: "#fca5a5" }}>
                {errors.coordenador_id}
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel icon={<CalendarDays className="h-4 w-4" />} required>
              Data de início
            </FieldLabel>
            <input
              type="date"
              value={dataInicio}
              onChange={(event) => {
                setDataInicio(event.target.value);
                setErrors((current) => ({ ...current, data_inicio: undefined }));
              }}
              disabled={readonly}
              className={inputClass(readonly)}
              style={{
                backgroundColor: "var(--input)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            />
            {errors.data_inicio ? (
              <p className="mt-2 text-xs" style={{ color: "#fca5a5" }}>
                {errors.data_inicio}
              </p>
            ) : null}
          </div>

          <div>
            <FieldLabel icon={<CalendarDays className="h-4 w-4" />}>
              Data de fim
            </FieldLabel>
            <input
              type="date"
              value={dataFim}
              onChange={(event) => setDataFim(event.target.value)}
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
      </section>

      <section
        className={sectionClass()}
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-5">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
            Recursos e rubricas
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>
            Campos financeiros estruturais da fase 1. Para projetos internos, esta seção fica reduzida.
          </p>
        </div>

        {tipo === "interno" ? (
          <div
            className="rounded-2xl border border-dashed px-4 py-4 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-0)",
              color: "var(--text-4)",
            }}
          >
            Projetos internos não exibem financiador, orçamento ou rubricas nesta fase.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <FieldLabel icon={<Users className="h-4 w-4" />} required>
                    Financiador
                  </FieldLabel>
                  <select
                    value={financiadorId}
                    onChange={(event) => {
                      setFinanciadorId(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        financiador_id: undefined,
                      }));
                    }}
                    disabled={readonly}
                    className={inputClass(readonly)}
                    style={{
                      backgroundColor: "var(--input)",
                      border: "1px solid var(--border)",
                      color: "var(--text-1)",
                    }}
                  >
                    <option value="">Selecione</option>
                    {financiadores.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  {errors.financiador_id ? (
                    <p className="mt-2 text-xs" style={{ color: "#fca5a5" }}>
                      {errors.financiador_id}
                    </p>
                  ) : null}
                </div>

                {!readonly && onCriarFinanciador ? (
                  <div
                    className="rounded-2xl p-3"
                    style={{
                      backgroundColor: "var(--surface-0)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-4)" }}>
                      Novo financiador
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={novoFinanciadorNome}
                        onChange={(event) => setNovoFinanciadorNome(event.target.value)}
                        className={inputClass(false)}
                        style={{
                          backgroundColor: "var(--input)",
                          border: "1px solid var(--border)",
                          color: "var(--text-1)",
                        }}
                        placeholder="Nome do financiador"
                      />
                      <button
                        type="button"
                        onClick={handleCriarFinanciador}
                        disabled={criandoFinanciador || !novoFinanciadorNome.trim()}
                        className="button-neutral inline-flex h-11 shrink-0 items-center rounded-2xl px-4 text-sm font-medium disabled:opacity-60"
                      >
                        {criandoFinanciador ? "Salvando..." : "Adicionar"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <FieldLabel icon={<DollarSign className="h-4 w-4" />} required>
                  Orçamento total
                </FieldLabel>
                <input
                  type="text"
                  value={orcamentoTotal}
                  onChange={(event) => {
                    setOrcamentoTotal(event.target.value);
                    setErrors((current) => ({
                      ...current,
                      orcamento_total: undefined,
                      rubricas: undefined,
                    }));
                  }}
                  disabled={readonly}
                  className={inputClass(readonly)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  placeholder="0,00"
                />
                {errors.orcamento_total ? (
                  <p className="mt-2 text-xs" style={{ color: "#fca5a5" }}>
                    {errors.orcamento_total}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <FieldLabel icon={<Tag className="h-4 w-4" />} required>
                    Rubricas
                  </FieldLabel>
                  <p className="text-sm" style={{ color: "var(--text-4)" }}>
                    A soma dos tetos deve ser exatamente igual ao orçamento total.
                  </p>
                </div>

                <div
                  className="rounded-full px-4 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                  }}
                >
                  Soma atual: {formatarNumero(totalRubricas)}
                </div>
              </div>

              {!readonly ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4"
                    style={{
                      backgroundColor: "var(--input)",
                      border: "1px solid var(--border)",
                      minHeight: 44,
                    }}
                  >
                    <Search className="h-4 w-4" style={{ color: "var(--text-4)" }} />
                    <input
                      type="text"
                      value={buscaRubrica}
                      onChange={(event) => setBuscaRubrica(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                      style={{ color: "var(--text-1)" }}
                      placeholder="Buscar rubrica global para adicionar"
                    />
                  </div>

                  {onCriarRubricaGlobal ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={novaRubricaNome}
                        onChange={(event) => setNovaRubricaNome(event.target.value)}
                        className={inputClass(false)}
                        style={{
                          backgroundColor: "var(--input)",
                          border: "1px solid var(--border)",
                          color: "var(--text-1)",
                        }}
                        placeholder="Nova rubrica"
                      />
                      <button
                        type="button"
                        onClick={handleCriarRubricaGlobal}
                        disabled={criandoRubrica || !novaRubricaNome.trim()}
                        className="button-neutral inline-flex h-11 shrink-0 items-center rounded-2xl px-4 text-sm font-medium disabled:opacity-60"
                      >
                        {criandoRubrica ? "Salvando..." : "Criar"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!readonly && rubricasDisponiveis.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {rubricasDisponiveis.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => adicionarRubrica(item.id)}
                      className="interactive-surface inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{item.nome}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                {rubricas.length > 0 ? (
                  rubricas.map((item) => {
                    const rubricaNome =
                      rubricasGlobais.find(
                        (rubrica) => rubrica.id === item.rubrica_global_id,
                      )?.nome ?? "Rubrica";

                    return (
                      <div
                        key={item.idLocal}
                        className="grid gap-3 rounded-2xl p-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
                        style={{
                          backgroundColor: "var(--surface-1)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                            {rubricaNome}
                          </p>
                        </div>

                        <input
                          type="text"
                          value={item.limite_teto_gasto}
                          onChange={(event) =>
                            atualizarRubrica(
                              item.idLocal,
                              "limite_teto_gasto",
                              event.target.value,
                            )
                          }
                          disabled={readonly}
                          className={inputClass(readonly)}
                          style={{
                            backgroundColor: "var(--input)",
                            border: "1px solid var(--border)",
                            color: "var(--text-1)",
                          }}
                          placeholder="0,00"
                        />

                        {!readonly ? (
                          <button
                            type="button"
                            onClick={() => removerRubrica(item.idLocal)}
                            className="button-danger inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium"
                          >
                            Remover
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div
                    className="rounded-2xl border border-dashed px-4 py-4 text-sm"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface-1)",
                      color: "var(--text-4)",
                    }}
                  >
                    Nenhuma rubrica adicionada.
                  </div>
                )}
              </div>

              {errors.rubricas ? (
                <p className="mt-3 text-xs" style={{ color: "#fca5a5" }}>
                  {errors.rubricas}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section
        className={sectionClass()}
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
              Links
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>
              Até 10 links por projeto. Título e URL são obrigatórios.
            </p>
          </div>

          {!readonly ? (
            <button
              type="button"
              onClick={adicionarLink}
              disabled={links.length >= 10}
              className="button-neutral inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium disabled:opacity-60"
            >
              Adicionar link
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {links.length > 0 ? (
            links.map((item) => (
              <div
                key={item.idLocal}
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
                    atualizarLink(item.idLocal, "titulo", event.target.value)
                  }
                  disabled={readonly}
                  className={inputClass(readonly)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  placeholder="Título"
                />

                <input
                  type="text"
                  value={item.url}
                  onChange={(event) =>
                    atualizarLink(item.idLocal, "url", event.target.value)
                  }
                  disabled={readonly}
                  className={inputClass(readonly)}
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                  placeholder="URL"
                />

                {!readonly ? (
                  <button
                    type="button"
                    onClick={() => removerLink(item.idLocal)}
                    className="button-danger inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium"
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div
              className="rounded-2xl border border-dashed px-4 py-4 text-sm"
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

        {errors.links ? (
          <p className="mt-3 text-xs" style={{ color: "#fca5a5" }}>
            {errors.links}
          </p>
        ) : null}
      </section>

      <section
        className={sectionClass()}
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-5">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
            Observações
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>
            Campo livre para contexto adicional do projeto.
          </p>
        </div>

        <textarea
          rows={4}
          value={observacoes}
          onChange={(event) => setObservacoes(event.target.value)}
          disabled={readonly}
          className={textAreaClass(readonly)}
          style={{
            backgroundColor: "var(--input)",
            border: "1px solid var(--border)",
            color: "var(--text-1)",
          }}
          placeholder="Observações internas"
        />
      </section>

      <section
        className={sectionClass()}
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
              Objetivos
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-4)" }}>
              Nesta fase, a área mostra apenas leitura resumida dos objetivos vinculados ao projeto.
            </p>
          </div>

          {projetoId && onAbrirTarefasProjeto ? (
            <button
              type="button"
              onClick={() => onAbrirTarefasProjeto(projetoId)}
              className="button-neutral inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium"
            >
              Abrir em Tarefas
            </button>
          ) : null}
        </div>

        {objetivos.length > 0 ? (
          <div className="space-y-3">
            {objetivos.map((objetivo) => (
              <ObjetivoItem key={objetivo.id} objetivo={objetivo} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl border border-dashed px-4 py-4 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-0)",
              color: "var(--text-4)",
            }}
          >
            Nenhum objetivo vinculado a este projeto até o momento.
          </div>
        )}
      </section>

      {!hideInternalSubmit ? (
        <div className="flex items-center justify-end pt-1">
          <button
            type={readonly ? "button" : "submit"}
            disabled={!readonly && submitting}
            className="button-primary inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Salvando..." : submitText}
          </button>
        </div>
      ) : null}
    </form>
  );
}