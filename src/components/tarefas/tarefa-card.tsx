"use client";

import Image from "next/image";

type ResponsavelCard = {
  id: string;
  nome: string;
  avatarUrl: string | null;
};

type BadgeSimples = {
  id: string;
  nome: string;
} | null;

type EquipeSimples = {
  id: string;
  nome: string;
  cor: string | null;
} | null;

type Props = {
  titulo: string;
  tipo?: "pai" | "filha" | "orfa";
  status: string;
  prioridade: string | null;
  prazo: string;
  horaEntrega?: string | null;
  categoria?: BadgeSimples;
  equipe?: EquipeSimples;
  objetivoTitulo?: string | null;
  responsaveis?: ResponsavelCard[];
  emAtraso?: boolean;
  compact?: boolean;
  onClick?: () => void;
  showStatus?: boolean;
  hideTipoBadge?: boolean;
  showEquipeBadge?: boolean;
};

function prioridadeClasse(prioridade: string | null) {
  switch (prioridade) {
    case "urgente":
      return "border-red-800 bg-red-950/40 text-red-200";
    case "alta":
      return "border-amber-800 bg-amber-950/40 text-amber-200";
    case "media":
      return "border-sky-800 bg-sky-950/40 text-sky-200";
    case "baixa":
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }
}

function statusClasse(status: string) {
  switch (status) {
    case "em_atraso":
      return "border-red-800 bg-red-950/40 text-red-200";
    case "atencao":
      return "border-amber-800 bg-amber-950/40 text-amber-200";
    case "concluida":
      return "border-emerald-800 bg-emerald-950/40 text-emerald-200";
    case "em_andamento":
      return "border-sky-800 bg-sky-950/40 text-sky-200";
    case "em_pausa":
      return "border-violet-800 bg-violet-950/40 text-violet-200";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function tipoClasse(tipo: "pai" | "filha" | "orfa" | undefined) {
  switch (tipo) {
    case "pai":
      return "border-violet-800/60 bg-violet-950/40 text-violet-200";
    case "filha":
      return "border-sky-800/60 bg-sky-950/40 text-sky-200";
    case "orfa":
      return "border-emerald-800/60 bg-emerald-950/40 text-emerald-200";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function formatarTipo(tipo: "pai" | "filha" | "orfa" | undefined) {
  if (tipo === "pai") return "Objetivo";
  if (tipo === "filha") return "Tarefa de Objetivo";
  if (tipo === "orfa") return "Tarefa";
  return "Item";
}

function formatarStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function formatarPrioridade(prioridade: string | null) {
  if (!prioridade) return "Sem prioridade";
  if (prioridade === "media") return "Média";
  return prioridade.charAt(0).toUpperCase() + prioridade.slice(1);
}

function formatarDataPadrao(data?: string | null) {
  if (!data) return "Sem prazo";

  const partes = data.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;

  return date.toLocaleDateString("pt-BR");
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function TarefaCard({
  titulo,
  tipo,
  status,
  prioridade,
  prazo,
  horaEntrega,
  categoria = null,
  equipe = null,
  objetivoTitulo = null,
  responsaveis = [],
  emAtraso = false,
  compact = false,
  onClick,
  showStatus = true,
  hideTipoBadge = false,
  showEquipeBadge = false,
}: Props) {
  const Wrapper = onClick ? "button" : "article";

  return (
    <Wrapper
      {...(onClick
        ? {
            type: "button" as const,
            onClick,
          }
        : {})}
      className={[
        "group w-full rounded-[24px] text-left transition",
        compact ? "p-3.5" : "p-4",
        onClick ? "hover:-translate-y-[1px]" : "",
      ].join(" ")}
      style={{
        backgroundColor: "var(--surface-2)",
        border: `1px solid ${emAtraso ? "#6b2328" : "var(--border)"}`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {!hideTipoBadge ? (
            <span
              className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-medium ${tipoClasse(
                tipo,
              )}`}
            >
              {formatarTipo(tipo)}
            </span>
          ) : null}

          {showStatus ? (
            <span
              className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-medium ${statusClasse(
                status,
              )}`}
            >
              {formatarStatusLabel(status)}
            </span>
          ) : null}
        </div>

        <span
          className={`inline-flex shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium ${prioridadeClasse(
            prioridade,
          )}`}
        >
          {formatarPrioridade(prioridade)}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-[15px] font-semibold leading-6 text-[var(--text-1)]">
        {titulo}
      </h3>

      {tipo === "filha" && objetivoTitulo ? (
        <p className="mt-2 text-xs text-[var(--text-3)]">
          Vinculada a:{" "}
          <span className="text-[var(--text-2)]">{objetivoTitulo}</span>
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {showEquipeBadge && equipe ? (
          <div
            className="rounded-2xl px-3 py-2.5"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-3)",
            }}
          >
            <span className="block text-[10px] uppercase tracking-[0.14em] text-[var(--text-4)]">
              Equipe
            </span>
            <span className="mt-1 block truncate text-sm text-[var(--text-2)]">
              {equipe.nome}
            </span>
          </div>
        ) : null}

        <div
          className="rounded-2xl px-3 py-2.5"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-3)",
          }}
        >
          <span className="block text-[10px] uppercase tracking-[0.14em] text-[var(--text-4)]">
            Categoria
          </span>
          <span className="mt-1 block truncate text-sm text-[var(--text-2)]">
            {categoria?.nome ?? "Sem categoria"}
          </span>
        </div>

        <div
          className="rounded-2xl px-3 py-2.5"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-3)",
          }}
        >
          <span className="block text-[10px] uppercase tracking-[0.14em] text-[var(--text-4)]">
            Data de entrega
          </span>
          <span className="mt-1 block text-sm text-[var(--text-2)]">
            {formatarDataPadrao(prazo)}
            {horaEntrega ? ` às ${horaEntrega}` : ""}
          </span>
        </div>
      </div>

      <div className="mt-4">
        {responsaveis.length ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {responsaveis.slice(0, 4).map((responsavel) => (
                <div
                  key={responsavel.id}
                  title={responsavel.nome}
                  className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-[var(--text-2)]"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface-1)",
                  }}
                >
                  {responsavel.avatarUrl ? (
                    <Image
                      src={responsavel.avatarUrl}
                      alt={responsavel.nome}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    iniciais(responsavel.nome)
                  )}
                </div>
              ))}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs text-[var(--text-2)]">
                {responsaveis[0]?.nome}
                {responsaveis.length > 1
                  ? ` +${responsaveis.length - 1}`
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-[var(--text-3)]">Sem responsáveis</span>
        )}
      </div>
    </Wrapper>
  );
}