"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Tarefa } from "@/types/tarefas/tarefas.types";

type Props = {
  tarefas: Tarefa[];
  onOpenTask?: (taskId: string) => void;
  showEquipeInfo?: boolean;
};

type CalendarView = "month" | "week" | "day";

type EventoCalendario = {
  id: string;
  titulo: string;
  dataEntrega: string;
  horaEntrega: string | null;
  status: Tarefa["status"];
  prioridade: Tarefa["prioridade"];
  equipe: Tarefa["tipo"] extends "pai" ? null : Tarefa["equipe"];
  concluida: boolean;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HORA_INICIAL_PADRAO = 8;
const HORA_FINAL_PADRAO = 18;
const LIMITE_EVENTOS_VISIVEIS = 2;
const PALETA_EQUIPES = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#14b8a6",
];

function formatarDataISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function inicioDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

function fimDoMes(data: Date) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0);
}

function inicioDaSemana(data: Date) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  copia.setDate(copia.getDate() - copia.getDay());
  return copia;
}

function adicionarDias(data: Date, dias: number) {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatarMesAno(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);
}

function formatarFaixaSemana(data: Date) {
  const inicio = inicioDaSemana(data);
  const fim = adicionarDias(inicio, 6);
  const mesmoMes = inicio.getMonth() === fim.getMonth();
  const mesmoAno = inicio.getFullYear() === fim.getFullYear();

  if (mesmoMes && mesmoAno) {
    return `${inicio.getDate()}–${fim.getDate()} de ${new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(inicio)}`;
  }

  return `${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(inicio)} – ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(fim)}`;
}

function formatarDataCompleta(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

function formatarHoraLabel(hora: number) {
  return `${String(hora).padStart(2, "0")}:00`;
}

function obterHora(item: EventoCalendario) {
  if (!item.horaEntrega) return null;
  const [hora] = item.horaEntrega.split(":");
  const numero = Number(hora);
  return Number.isNaN(numero) ? null : numero;
}

function ordenarEventosBase(a: EventoCalendario, b: EventoCalendario) {
  if (!a.horaEntrega && b.horaEntrega) return -1;
  if (a.horaEntrega && !b.horaEntrega) return 1;

  if (a.horaEntrega && b.horaEntrega) {
    const comparacaoHora = a.horaEntrega.localeCompare(b.horaEntrega);
    if (comparacaoHora !== 0) return comparacaoHora;
  }

  if (a.prioridade === "urgente" && b.prioridade !== "urgente") return -1;
  if (a.prioridade !== "urgente" && b.prioridade === "urgente") return 1;

  if (a.prioridade === "alta" && !["urgente", "alta"].includes(b.prioridade ?? "")) {
    return -1;
  }

  if (b.prioridade === "alta" && !["urgente", "alta"].includes(a.prioridade ?? "")) {
    return 1;
  }

  return a.titulo.localeCompare(b.titulo);
}

function ordenarGrupoComConcluidasNoFim(items: EventoCalendario[]) {
  if (items.length <= 1) return items;

  return [...items].sort((a, b) => {
    if (a.concluida && !b.concluida) return 1;
    if (!a.concluida && b.concluida) return -1;
    return ordenarEventosBase(a, b);
  });
}

function montarGradeMes(dataBase: Date) {
  const inicioMes = inicioDoMes(dataBase);
  const fimMes = fimDoMes(dataBase);
  const inicioGrade = inicioDaSemana(inicioMes);
  const fimGrade = adicionarDias(inicioDaSemana(fimMes), 6);
  const dias: Date[] = [];
  let cursor = new Date(inicioGrade);

  while (cursor <= fimGrade) {
    dias.push(new Date(cursor));
    cursor = adicionarDias(cursor, 1);
  }

  return dias;
}

function getEventoOpacity(concluida: boolean) {
  return concluida ? 0.58 : 1;
}

function gerarIndiceCorEquipe(chave: string) {
  let hash = 0;
  for (let index = 0; index < chave.length; index += 1) {
    hash = (hash * 31 + chave.charCodeAt(index)) >>> 0;
  }
  return hash % PALETA_EQUIPES.length;
}

function getEquipeAccent(
  equipe?: { id?: string | null; nome?: string | null; cor?: string | null } | null,
) {
  if (equipe?.cor && equipe.cor.trim()) {
    return equipe.cor;
  }

  const chave = equipe?.id ?? equipe?.nome ?? "sem-equipe";
  return PALETA_EQUIPES[gerarIndiceCorEquipe(chave)];
}

function montarHorasVisiveis(eventos: EventoCalendario[]) {
  const horasBase: number[] = [];
  for (let hora = HORA_INICIAL_PADRAO; hora <= HORA_FINAL_PADRAO; hora += 1) {
    horasBase.push(hora);
  }

  const horasExtras = eventos
    .map(obterHora)
    .filter((hora): hora is number => hora !== null)
    .filter((hora) => hora < HORA_INICIAL_PADRAO || hora > HORA_FINAL_PADRAO);

  return Array.from(new Set([...horasBase, ...horasExtras])).sort((a, b) => a - b);
}

function EventoChip({
  item,
  onOpenTask,
  compact = false,
  showEquipeInfo = false,
}: {
  item: EventoCalendario;
  onOpenTask?: (taskId: string) => void;
  compact?: boolean;
  showEquipeInfo?: boolean;
}) {
  const Wrapper = onOpenTask ? "button" : "article";
  const accent = getEquipeAccent(item.equipe);

  return (
    <Wrapper
      {...(onOpenTask
        ? {
            type: "button" as const,
            onClick: () => onOpenTask(item.id),
          }
        : {})}
      className={[
        "w-full rounded-xl px-2.5 py-2 text-left transition",
        onOpenTask ? "interactive-surface" : "",
        compact ? "min-h-[34px]" : "",
      ].join(" ")}
      style={{
        backgroundColor: "var(--surface-2)",
        border: `1px solid ${accent}`,
        borderLeftWidth: "4px",
        opacity: getEventoOpacity(item.concluida),
        boxShadow: "var(--shadow-card)",
      }}
      title={item.titulo}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {item.concluida ? (
            <span
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: "var(--success)",
                color: "var(--text-1)",
              }}
            >
              ✓
            </span>
          ) : null}

          <span
            className={["block min-w-0 truncate text-xs font-medium", compact ? "leading-5" : ""].join(" ")}
            style={{ color: "var(--text-1)" }}
          >
            {item.titulo}
          </span>
        </div>

        {!compact ? (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
            <span style={{ color: "var(--text-4)" }}>
              {item.horaEntrega ? item.horaEntrega.slice(0, 5) : "Sem horário"}
            </span>

            {showEquipeInfo && item.equipe ? (
              <>
                <span style={{ color: "var(--text-4)" }}>•</span>
                <span className="truncate" style={{ color: "var(--text-3)" }}>
                  {item.equipe.nome}
                </span>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </Wrapper>
  );
}

function ExpandableEventList({
  groupKey,
  items,
  limit = LIMITE_EVENTOS_VISIVEIS,
  compact = false,
  onOpenTask,
  showEquipeInfo = false,
  expandedGroup,
  setExpandedGroup,
  popoverAlign = "left",
  popoverWidth = "min(320px, calc(100vw - 2rem))",
}: {
  groupKey: string;
  items: EventoCalendario[];
  limit?: number;
  compact?: boolean;
  onOpenTask?: (taskId: string) => void;
  showEquipeInfo?: boolean;
  expandedGroup: string | null;
  setExpandedGroup: (value: string | null) => void;
  popoverAlign?: "left" | "right";
  popoverWidth?: string;
}) {
  const isExpanded = expandedGroup === groupKey;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const orderedItems = useMemo(() => ordenarGrupoComConcluidasNoFim(items), [items]);
  const visibleItems = useMemo(() => orderedItems.slice(0, limit), [orderedItems, limit]);
  const hiddenCount = Math.max(orderedItems.length - limit, 0);

  useEffect(() => {
    if (!isExpanded) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!containerRef.current || !target) return;
      if (!containerRef.current.contains(target)) {
        setExpandedGroup(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isExpanded, setExpandedGroup]);

  if (orderedItems.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="space-y-1">
        {visibleItems.map((item) => (
          <EventoChip
            key={item.id}
            item={item}
            onOpenTask={onOpenTask}
            compact={compact}
            showEquipeInfo={showEquipeInfo}
          />
        ))}
      </div>

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpandedGroup(groupKey);
          }}
          className="mt-1 inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-medium transition hover:opacity-90"
          style={{
            color: "var(--text-3)",
            backgroundColor: "var(--surface-0)",
            border: "1px solid var(--border)",
          }}
        >
          +{hiddenCount}
        </button>
      ) : null}

      {isExpanded && hiddenCount > 0 ? (
        <div
          className="absolute inset-x-0 top-0 z-30 rounded-2xl p-2"
          style={{
            left: popoverAlign === "left" ? 0 : undefined,
            right: popoverAlign === "right" ? 0 : undefined,
            width: popoverWidth,
            maxHeight: "260px",
            overflow: "auto",
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border-strong)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium" style={{ color: "var(--text-2)" }}>
              {orderedItems.length} tarefa{orderedItems.length > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setExpandedGroup(null);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs transition hover:opacity-90"
              style={{
                color: "var(--text-3)",
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
              }}
              aria-label="Fechar lista"
            >
              ×
            </button>
          </div>

          <div className="space-y-1.5">
            {orderedItems.map((item) => (
              <EventoChip
                key={item.id}
                item={item}
                onOpenTask={onOpenTask}
                compact={compact}
                showEquipeInfo={showEquipeInfo}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TarefasWeekCalendar({
  tarefas,
  onOpenTask,
  showEquipeInfo = false,
}: Props) {
  const [view, setView] = useState<CalendarView>("month");
  const [dataBase, setDataBase] = useState<Date>(() => new Date());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const eventos = useMemo<EventoCalendario[]>(
    () =>
      tarefas
        .map((tarefa) => ({
          id: tarefa.id,
          titulo: tarefa.titulo,
          dataEntrega: tarefa.dataEntrega,
          horaEntrega: tarefa.horaEntrega,
          status: tarefa.status,
          prioridade: tarefa.prioridade,
          equipe: tarefa.tipo === "pai" ? null : tarefa.equipe,
          concluida: tarefa.status === "concluida",
        }))
        .sort(ordenarEventosBase),
    [tarefas],
  );

  const eventosPorData = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();

    for (const evento of eventos) {
      const lista = mapa.get(evento.dataEntrega) ?? [];
      lista.push(evento);
      mapa.set(evento.dataEntrega, lista);
    }

    for (const [chave, lista] of mapa.entries()) {
      mapa.set(chave, [...lista].sort(ordenarEventosBase));
    }

    return mapa;
  }, [eventos]);

  const legendaEquipes = useMemo(() => {
    const mapa = new Map<string, { nome: string; cor: string }>();

    for (const evento of eventos) {
      if (!evento.equipe?.id || !evento.equipe.nome) continue;
      mapa.set(evento.equipe.id, {
        nome: evento.equipe.nome,
        cor: getEquipeAccent(evento.equipe),
      });
    }

    return Array.from(mapa.entries())
      .map(([id, equipe]) => ({ id, ...equipe }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [eventos]);

  const diasDoMes = useMemo(() => montarGradeMes(dataBase), [dataBase]);
  const inicioSemanaAtual = useMemo(() => inicioDaSemana(dataBase), [dataBase]);
  const diasDaSemana = useMemo(
    () => Array.from({ length: 7 }, (_, index) => adicionarDias(inicioSemanaAtual, index)),
    [inicioSemanaAtual],
  );

  const eventosSemanaAtual = useMemo(
    () => diasDaSemana.flatMap((dia) => eventosPorData.get(formatarDataISO(dia)) ?? []),
    [diasDaSemana, eventosPorData],
  );
  const horasSemana = useMemo(() => montarHorasVisiveis(eventosSemanaAtual), [eventosSemanaAtual]);

  const dataBaseISO = useMemo(() => formatarDataISO(dataBase), [dataBase]);
  const eventosDiaAtual = useMemo(() => eventosPorData.get(dataBaseISO) ?? [], [eventosPorData, dataBaseISO]);
  const tarefasSemHorarioDia = useMemo(
    () => eventosDiaAtual.filter((item) => !item.horaEntrega),
    [eventosDiaAtual],
  );
  const tarefasSemHorarioSemana = useMemo(
    () =>
      diasDaSemana.map((dia) => ({
        dia,
        itens: (eventosPorData.get(formatarDataISO(dia)) ?? []).filter((item) => !item.horaEntrega),
      })),
    [diasDaSemana, eventosPorData],
  );
  const existeSemHorarioSemana = useMemo(
    () => tarefasSemHorarioSemana.some((grupo) => grupo.itens.length > 0),
    [tarefasSemHorarioSemana],
  );
  const horasDia = useMemo(() => montarHorasVisiveis(eventosDiaAtual), [eventosDiaAtual]);

  function resetPopover() {
    setExpandedGroup(null);
  }

  function navegarAnterior() {
    resetPopover();
    setDataBase((atual) => {
      if (view === "month") return new Date(atual.getFullYear(), atual.getMonth() - 1, 1);
      if (view === "week") return adicionarDias(atual, -7);
      return adicionarDias(atual, -1);
    });
  }

  function navegarProximo() {
    resetPopover();
    setDataBase((atual) => {
      if (view === "month") return new Date(atual.getFullYear(), atual.getMonth() + 1, 1);
      if (view === "week") return adicionarDias(atual, 7);
      return adicionarDias(atual, 1);
    });
  }

  function irParaHoje() {
    resetPopover();
    setDataBase(new Date());
  }

  function abrirDia(data: Date) {
    resetPopover();
    setDataBase(new Date(data));
    setView("day");
  }

  function trocarView(nextView: CalendarView) {
    resetPopover();
    setView(nextView);
  }

  function renderTituloPeriodo() {
    if (view === "month") return formatarMesAno(dataBase);
    if (view === "week") return formatarFaixaSemana(dataBase);
    return formatarDataCompleta(dataBase);
  }

  return (
    <section className="space-y-3">
      <div
        className="flex flex-col gap-3 rounded-[24px] p-3 md:flex-row md:items-start md:justify-between"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={irParaHoje}
              className="button-neutral inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium"
            >
              Hoje
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={navegarAnterior}
                className="button-neutral inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium"
                aria-label="Período anterior"
              >
                ←
              </button>

              <button
                type="button"
                onClick={navegarProximo}
                className="button-neutral inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium"
                aria-label="Próximo período"
              >
                →
              </button>
            </div>

            <h2 className="ml-1 text-base font-semibold capitalize text-[var(--text-1)] md:text-lg">
              {renderTituloPeriodo()}
            </h2>
          </div>

          {showEquipeInfo && legendaEquipes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {legendaEquipes.map((equipe) => (
                <div
                  key={equipe.id}
                  className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px]"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface-0)",
                    color: "var(--text-3)",
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: equipe.cor }}
                  />
                  <span>{equipe.nome}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className="inline-flex w-full overflow-x-auto rounded-2xl p-1 md:w-auto"
          style={{
            backgroundColor: "var(--surface-0)",
            border: "1px solid var(--border)",
          }}
        >
          {[
            { value: "month", label: "Mês" },
            { value: "week", label: "Semana" },
            { value: "day", label: "Dia" },
          ].map((option) => {
            const active = view === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => trocarView(option.value as CalendarView)}
                className="inline-flex h-9 min-w-[84px] items-center justify-center rounded-xl px-3 text-sm font-medium transition"
                style={{
                  backgroundColor: active ? "var(--surface-3)" : "transparent",
                  color: active ? "var(--text-1)" : "var(--text-3)",
                  border: active ? "1px solid var(--border-strong)" : "1px solid transparent",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "month" ? (
        <div
          className="overflow-hidden rounded-[24px]"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="px-2 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.12em]"
                style={{ color: "var(--text-4)" }}
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {diasDoMes.map((dia) => {
              const diaISO = formatarDataISO(dia);
              const itens = eventosPorData.get(diaISO) ?? [];
              const foraDoMes = dia.getMonth() !== dataBase.getMonth();
              const hoje = mesmoDia(dia, new Date());

              return (
                <div
                  key={diaISO}
                  className="min-h-[132px] border-b border-r p-2 md:min-h-[148px]"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: foraDoMes ? "rgba(255,255,255,0.01)" : "var(--surface-1)",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => abrirDia(dia)}
                      className="inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-medium transition hover:opacity-90"
                      style={{
                        backgroundColor: hoje ? "var(--surface-3)" : "transparent",
                        color: foraDoMes ? "var(--text-4)" : "var(--text-2)",
                        border: hoje ? "1px solid var(--border-strong)" : "1px solid transparent",
                      }}
                      aria-label={`Abrir dia ${dia.getDate()}`}
                    >
                      {dia.getDate()}
                    </button>

                    {itens.length > 0 ? (
                      <span className="text-[10px]" style={{ color: "var(--text-4)" }}>
                        {itens.length}
                      </span>
                    ) : null}
                  </div>

                  <ExpandableEventList
                    groupKey={`month:${diaISO}`}
                    items={itens}
                    compact
                    onOpenTask={onOpenTask}
                    expandedGroup={expandedGroup}
                    setExpandedGroup={setExpandedGroup}
                    popoverAlign={dia.getDay() >= 5 ? "right" : "left"}
                    popoverWidth="min(280px, calc(100vw - 2rem))"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === "week" ? (
        <div
          className="overflow-hidden rounded-[24px]"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="max-h-[calc(100vh-280px)] overflow-auto">
            <div className="min-w-[880px]">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div className="px-2 py-2.5" />
                {diasDaSemana.map((dia, index) => {
                  const diaISO = formatarDataISO(dia);
                  const itens = eventosPorData.get(diaISO) ?? [];
                  const hoje = mesmoDia(dia, new Date());

                  return (
                    <div key={diaISO} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => abrirDia(dia)}
                        className="w-full rounded-xl px-1 py-1.5 transition hover:opacity-90"
                        style={{ backgroundColor: "transparent" }}
                        aria-label={`Abrir visualização diária de ${dia.getDate()}`}
                      >
                        <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--text-4)" }}>
                          {DIAS_SEMANA[index]}
                        </div>
                        <div
                          className="mt-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold"
                          style={{
                            backgroundColor: hoje ? "var(--surface-3)" : "transparent",
                            color: "var(--text-1)",
                            border: hoje ? "1px solid var(--border-strong)" : "1px solid transparent",
                          }}
                        >
                          {dia.getDate()}
                        </div>
                        {itens.length > 0 ? (
                          <div className="mt-1 text-[10px]" style={{ color: "var(--text-4)" }}>
                            {itens.length}
                          </div>
                        ) : null}
                      </button>
                    </div>
                  );
                })}
              </div>

              {existeSemHorarioSemana ? (
                <div className="grid" style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}>
                  <div className="border-r px-2 py-2.5" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--text-4)" }}>
                      Sem hora
                    </span>
                  </div>

                  {tarefasSemHorarioSemana.map(({ dia, itens }) => (
                    <div
                      key={`sem-horario-${formatarDataISO(dia)}`}
                      className="min-h-[54px] border-r px-1.5 py-1.5"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <ExpandableEventList
                        groupKey={`week:no-time:${formatarDataISO(dia)}`}
                        items={itens}
                        compact
                        onOpenTask={onOpenTask}
                        showEquipeInfo={showEquipeInfo}
                        expandedGroup={expandedGroup}
                        setExpandedGroup={setExpandedGroup}
                        popoverAlign={dia.getDay() >= 5 ? "right" : "left"}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid" style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}>
                {horasSemana.map((hora) => (
                  <FragmentoLinhaSemana
                    key={hora}
                    horaIndex={hora}
                    horaLabel={formatarHoraLabel(hora)}
                    diasDaSemana={diasDaSemana}
                    eventosPorData={eventosPorData}
                    onOpenTask={onOpenTask}
                    showEquipeInfo={showEquipeInfo}
                    expandedGroup={expandedGroup}
                    setExpandedGroup={setExpandedGroup}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {view === "day" ? (
        <div
          className="overflow-hidden rounded-[24px]"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="border-b px-3 py-3" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-sm font-medium capitalize text-[var(--text-2)]">{formatarDataCompleta(dataBase)}</h3>
          </div>

          <div className="max-h-[calc(100vh-280px)] overflow-auto">
            {tarefasSemHorarioDia.length > 0 ? (
              <div className="border-b px-3 py-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--text-4)" }}>
                  Sem hora
                </div>

                <ExpandableEventList
                  groupKey={`day:no-time:${dataBaseISO}`}
                  items={tarefasSemHorarioDia}
                  onOpenTask={onOpenTask}
                  showEquipeInfo={showEquipeInfo}
                  expandedGroup={expandedGroup}
                  setExpandedGroup={setExpandedGroup}
                  popoverWidth="min(420px, calc(100vw - 2rem))"
                />
              </div>
            ) : null}

            <div>
              {horasDia.map((hora) => {
                const itensHora = eventosDiaAtual.filter((item) => obterHora(item) === hora);

                return (
                  <div
                    key={hora}
                    className="grid border-b"
                    style={{
                      gridTemplateColumns: "64px minmax(0, 1fr)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div
                      className="border-r px-2 py-3 text-[11px] font-medium"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-4)",
                      }}
                    >
                      {formatarHoraLabel(hora)}
                    </div>

                    <div className="min-h-[52px] px-2 py-1.5">
                      <ExpandableEventList
                        groupKey={`day:hour:${dataBaseISO}:${hora}`}
                        items={itensHora}
                        onOpenTask={onOpenTask}
                        showEquipeInfo={showEquipeInfo}
                        expandedGroup={expandedGroup}
                        setExpandedGroup={setExpandedGroup}
                        popoverWidth="min(420px, calc(100vw - 2rem))"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FragmentoLinhaSemana({
  horaIndex,
  horaLabel,
  diasDaSemana,
  eventosPorData,
  onOpenTask,
  showEquipeInfo,
  expandedGroup,
  setExpandedGroup,
}: {
  horaIndex: number;
  horaLabel: string;
  diasDaSemana: Date[];
  eventosPorData: Map<string, EventoCalendario[]>;
  onOpenTask?: (taskId: string) => void;
  showEquipeInfo: boolean;
  expandedGroup: string | null;
  setExpandedGroup: (value: string | null) => void;
}) {
  return (
    <>
      <div
        className="border-r border-t px-2 py-3 text-[11px] font-medium"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-4)",
        }}
      >
        {horaLabel}
      </div>

      {diasDaSemana.map((dia) => {
        const diaISO = formatarDataISO(dia);
        const itens = (eventosPorData.get(diaISO) ?? []).filter((item) => obterHora(item) === horaIndex);

        return (
          <div
            key={`${diaISO}-${horaLabel}`}
            className="min-h-[52px] border-r border-t px-1.5 py-1.5"
            style={{ borderColor: "var(--border)" }}
          >
            <ExpandableEventList
              groupKey={`week:hour:${diaISO}:${horaIndex}`}
              items={itens}
              compact
              onOpenTask={onOpenTask}
              showEquipeInfo={showEquipeInfo}
              expandedGroup={expandedGroup}
              setExpandedGroup={setExpandedGroup}
              popoverAlign={dia.getDay() >= 5 ? "right" : "left"}
            />
          </div>
        );
      })}
    </>
  );
}
