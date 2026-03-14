"use client";

import { useMemo, useState } from "react";

import { adicionarComentario } from "@/actions/tarefas/adicionar-comentario";
import { buscarTarefa } from "@/actions/tarefas/buscar-tarefa";
import { criarTarefa } from "@/actions/tarefas/criar-tarefa";
import { editarComentario } from "@/actions/tarefas/editar-comentario";
import { editarTarefa } from "@/actions/tarefas/editar-tarefa";
import { excluirComentario } from "@/actions/tarefas/excluir-comentario";
import { excluirTarefa } from "@/actions/tarefas/excluir-tarefa";
import type { EquipeTarefaOption } from "@/actions/tarefas/listar-equipes-tarefas";
import { moverTarefaStatus } from "@/actions/tarefas/mover-tarefa-status";
import { reabrirTarefa } from "@/actions/tarefas/reabrir-tarefa";
import { TarefaOperacionalModal } from "@/components/tarefas/tarefa-operacional-modal";
import { TarefaPaiModal } from "@/components/tarefas/tarefa-pai-modal";
import { TarefasFilters } from "@/components/tarefas/tarefas-filters";
import { TarefasKanban } from "@/components/tarefas/tarefas-kanban";
import { TarefasTable } from "@/components/tarefas/tarefas-table";
import { TarefasViewSwitcher } from "@/components/tarefas/tarefas-view-switcher";
import { TarefasWeekCalendar } from "@/components/tarefas/tarefas-week-calendar";
import type {
  CategoriaTarefa,
  CriarTarefaInput,
  EditarTarefaInput,
  ResultadoOperacaoTarefa,
  StatusTarefa,
  Tarefa,
  TarefaCalendarioDia,
  TarefaCalendarioItem,
  TarefaDetalhe,
  TarefaKanbanCard,
  TarefasFiltros,
  TarefasPaginadas,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type Props = {
  resultadoInicial: ResultadoOperacaoTarefa<TarefasPaginadas<Tarefa>>;
  usuariosIniciais: UsuarioResumoTarefa[];
  equipesIniciais: EquipeTarefaOption[];
  categoriasIniciais: CategoriaTarefa[];
  usuarioAtual: UsuarioResumoTarefa | null;
};

type ViewMode = "kanban" | "table" | "week";

type ModalState =
  | { open: false }
  | { open: true; mode: "create"; tipo: "pai" | "filha" | "orfa" }
  | {
      open: true;
      mode: "view" | "edit";
      tipo: "pai" | "filha" | "orfa";
      tarefaId: string;
    };

type PayloadModalPai = {
  tipo: "pai";
  titulo: string;
  descricao?: string | null;
  projetoId?: string | null;
  prioridade?: "urgente" | "alta" | "media" | "baixa" | null;
  status?:
    | "a_fazer"
    | "em_andamento"
    | "atencao"
    | "em_pausa"
    | "em_atraso"
    | "concluida";
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: string[];
  links: Array<{ id?: string; url: string; texto?: string | null }>;
};

type PayloadModalOperacional = {
  tipo: "filha" | "orfa";
  titulo: string;
  descricao?: string | null;
  tarefaPaiId?: string | null;
  equipeId?: string | null;
  categoriaId?: string | null;
  prioridade?: "urgente" | "alta" | "media" | "baixa" | null;
  status?:
    | "a_fazer"
    | "em_andamento"
    | "atencao"
    | "em_pausa"
    | "em_atraso"
    | "concluida";
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: string[];
  links: Array<{ id?: string; url: string; texto?: string | null }>;
};

function prioridadePeso(prioridade: Tarefa["prioridade"]) {
  switch (prioridade) {
    case "urgente":
      return 0;
    case "alta":
      return 1;
    case "media":
      return 2;
    case "baixa":
      return 3;
    default:
      return 4;
  }
}

function formatarStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function formatarTipoLabel(tipo: "pai" | "filha" | "orfa") {
  if (tipo === "pai") return "Objetivo";
  if (tipo === "filha") return "Tarefa de Objetivo";
  return "Tarefa";
}

function corTipoLabel(tipo: "pai" | "filha" | "orfa") {
  if (tipo === "pai") {
    return "border-violet-800/60 bg-violet-950/40 text-violet-200";
  }

  if (tipo === "filha") {
    return "border-sky-800/60 bg-sky-950/40 text-sky-200";
  }

  return "border-emerald-800/60 bg-emerald-950/40 text-emerald-200";
}

function prazoTimestamp(dataEntrega: string, horaEntrega: string | null) {
  return new Date(
    horaEntrega ? `${dataEntrega}T${horaEntrega}:00` : `${dataEntrega}T23:59:59`,
  ).getTime();
}

function mapResponsaveisResumo(
  responsaveis:
    | Array<{
        id: string;
        nome: string;
        avatarUrl?: string | null;
      }>
    | undefined,
) {
  return (responsaveis ?? []).map((responsavel) => ({
    id: responsavel.id,
    nome: responsavel.nome,
    avatarUrl: responsavel.avatarUrl ?? null,
  }));
}

function mapTarefaToKanbanCard(tarefa: Tarefa): TarefaKanbanCard {
  return {
    id: tarefa.id,
    tipo: tarefa.tipo,
    titulo: tarefa.titulo,
    status: tarefa.status,
    prioridade: tarefa.prioridade,
    categoria:
      tarefa.tipo === "pai" || !tarefa.categoria
        ? null
        : {
            id: tarefa.categoria.id,
            nome: tarefa.categoria.nome,
          },
    equipe: tarefa.tipo === "pai" ? null : tarefa.equipe,
    prazo: formatarDataPadrao(tarefa.dataEntrega),
    horaEntrega: tarefa.horaEntrega,
    responsaveis: mapResponsaveisResumo(tarefa.responsaveis),
    emAtraso: tarefa.status === "em_atraso",
  };
}

function calcularResumoObjetivo(
  objetivoId: string,
  tarefasBase: Tarefa[],
) {
  const filhas = tarefasBase.filter((tarefa) => tarefa.tarefaPaiId === objetivoId);
  const total = filhas.length;
  const concluidas = filhas.filter((tarefa) => tarefa.status === "concluida").length;
  const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return {
    total,
    concluidas,
    percentual,
  };
}

function organizarSemana(itens: Tarefa[]): TarefaCalendarioDia[] {
  const mapa = new Map<string, TarefaCalendarioItem[]>();

  for (const tarefa of itens) {
    const atual = mapa.get(tarefa.dataEntrega) ?? [];
    atual.push({
      id: tarefa.id,
      titulo: tarefa.titulo,
      dataEntrega: tarefa.dataEntrega,
      horaEntrega: tarefa.horaEntrega,
      status: tarefa.status,
      prioridade: tarefa.prioridade,
      equipe: tarefa.tipo === "pai" ? null : tarefa.equipe,
      categoria:
        tarefa.tipo === "pai" || !tarefa.categoria
          ? null
          : {
              id: tarefa.categoria.id,
              nome: tarefa.categoria.nome,
            },
      responsaveis: mapResponsaveisResumo(tarefa.responsaveis),
      emAtraso: tarefa.status === "em_atraso",
    });
    mapa.set(tarefa.dataEntrega, atual);
  }

  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, itensDia]) => ({
      data,
      itens: itensDia.sort((a, b) => {
        if (a.horaEntrega && !b.horaEntrega) return -1;
        if (!a.horaEntrega && b.horaEntrega) return 1;

        const prioridade =
          prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
        if (prioridade !== 0) return prioridade;

        return (
          prazoTimestamp(a.dataEntrega, a.horaEntrega) -
          prazoTimestamp(b.dataEntrega, b.horaEntrega)
        );
      }),
    }));
}

function aplicarFiltrosLocais(
  itens: Tarefa[],
  filtros: TarefasFiltros,
): Tarefa[] {
  let resultado = [...itens];

  if (filtros.apenasAtrasadas) {
    resultado = resultado.filter((item) => item.status === "em_atraso");
  }

  if (filtros.status?.length) {
    resultado = resultado.filter((item) => filtros.status?.includes(item.status));
  }

  if (filtros.prioridades?.length) {
    resultado = resultado.filter(
      (item) =>
        item.prioridade !== null &&
        filtros.prioridades?.includes(item.prioridade),
    );
  }

  if (filtros.responsavelIds?.length) {
  resultado = resultado.filter((item) =>
    item.responsaveis?.some((responsavel) =>
      filtros.responsavelIds?.includes(responsavel.id),
    ),
  );
}

  if (filtros.busca?.trim()) {
    const termo = filtros.busca.trim().toLowerCase();

    resultado = resultado.filter((item) => {
      const titulo = item.titulo.toLowerCase();
      const descricao = item.descricao?.toLowerCase() ?? "";
      const categoria =
        item.tipo === "pai" ? "" : item.categoria?.nome.toLowerCase() ?? "";

      return (
        titulo.includes(termo) ||
        descricao.includes(termo) ||
        categoria.includes(termo)
      );
    });
  }

  switch (filtros.ordenacao) {
    case "alfabetica":
      resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
      break;
    case "prioridade":
      resultado.sort(
        (a, b) => prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade),
      );
      break;
    case "status":
      resultado.sort((a, b) => a.status.localeCompare(b.status));
      break;
    case "data_entrega":
    default:
      resultado.sort(
        (a, b) =>
          prazoTimestamp(a.dataEntrega, a.horaEntrega) -
          prazoTimestamp(b.dataEntrega, b.horaEntrega),
      );
      break;
  }

  return resultado;
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

function detalheParaTarefaBase(detalhe: TarefaDetalhe): Tarefa {
  if (detalhe.tipo === "pai") {
    return {
      id: detalhe.id,
      tipo: "pai",
      titulo: detalhe.titulo,
      descricao: detalhe.descricao,
      projetoId: detalhe.projetoId,
      prioridade: detalhe.prioridade,
      status: detalhe.status,
      dataEntrega: detalhe.dataEntrega,
      horaEntrega: detalhe.horaEntrega,
      dataConclusao: detalhe.dataConclusao,
      criadoPorId: detalhe.criadoPorId,
      atualizadoPorId: detalhe.atualizadoPorId,
      dataCriacao: detalhe.dataCriacao,
      dataAtualizacao: detalhe.dataAtualizacao,
      tarefaPaiId: null,
      equipeId: null,
      equipe: null,
      categoriaId: null,
      categoria: null,
    };
  }

  if (detalhe.tipo === "filha") {
    return {
      id: detalhe.id,
      tipo: "filha",
      titulo: detalhe.titulo,
      descricao: detalhe.descricao,
      projetoId: detalhe.projetoId,
      prioridade: detalhe.prioridade,
      status: detalhe.status,
      dataEntrega: detalhe.dataEntrega,
      horaEntrega: detalhe.horaEntrega,
      dataConclusao: detalhe.dataConclusao,
      criadoPorId: detalhe.criadoPorId,
      atualizadoPorId: detalhe.atualizadoPorId,
      dataCriacao: detalhe.dataCriacao,
      dataAtualizacao: detalhe.dataAtualizacao,
      tarefaPaiId: detalhe.tarefaPaiId,
      equipeId: detalhe.equipeId,
      equipe: detalhe.equipe,
      categoriaId: detalhe.categoriaId,
      categoria: detalhe.categoria,
    };
  }

  return {
    id: detalhe.id,
    tipo: "orfa",
    titulo: detalhe.titulo,
    descricao: detalhe.descricao,
    projetoId: detalhe.projetoId,
    prioridade: detalhe.prioridade,
    status: detalhe.status,
    dataEntrega: detalhe.dataEntrega,
    horaEntrega: detalhe.horaEntrega,
    dataConclusao: detalhe.dataConclusao,
    criadoPorId: detalhe.criadoPorId,
    atualizadoPorId: detalhe.atualizadoPorId,
    dataCriacao: detalhe.dataCriacao,
    dataAtualizacao: detalhe.dataAtualizacao,
    tarefaPaiId: null,
    equipeId: detalhe.equipeId,
    equipe: detalhe.equipe,
    categoriaId: detalhe.categoriaId,
    categoria: detalhe.categoria,
  };
}

export function TarefasPageClient({
  resultadoInicial,
  usuariosIniciais,
  equipesIniciais,
  categoriasIniciais,
  usuarioAtual,
}: Props) {
  const [view, setView] = useState<ViewMode>("kanban");
  const [filtrosObjetivos, setFiltrosObjetivos] = useState<TarefasFiltros>({
    ordenacao: "data_entrega",
  });
  const [filtrosTarefas, setFiltrosTarefas] = useState<TarefasFiltros>({
    ordenacao: "data_entrega",
  });
  const [itensState, setItensState] = useState<Tarefa[]>(
    resultadoInicial.data?.itens ?? [],
  );
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [tarefaAtual, setTarefaAtual] = useState<TarefaDetalhe | null>(null);
  const [loadingTarefa, setLoadingTarefa] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [processingComment, setProcessingComment] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const erroInicial = !resultadoInicial.sucesso
    ? resultadoInicial.mensagem
    : null;

  const perfilAtual = usuarioAtual?.perfil ?? null;
  
  const podeVerObjetivos = [
    "admin_supremo",
    "coordenador_geral",
    "coordenador_equipe",
    "assistente",
  ].includes(perfilAtual ?? "");
  
  const podeCriarObjetivos = [
    "admin_supremo",
    "coordenador_geral",
    "coordenador_equipe",
    "assistente",
  ].includes(perfilAtual ?? "");

  const podeVerTodasEquipes = [
    "admin_supremo",
    "coordenador_geral",
  ].includes(perfilAtual ?? "");

  const itens = useMemo(() => itensState, [itensState]);

  const objetivosBase = useMemo(
    () => itens.filter((item) => item.tipo === "pai"),
    [itens],
  );

  const tarefasBase = useMemo(
    () => itens.filter((item) => item.tipo !== "pai"),
    [itens],
  );

  const objetivos = useMemo(
    () =>
      podeVerObjetivos
        ? aplicarFiltrosLocais(objetivosBase, filtrosObjetivos)
        : [],
    [objetivosBase, filtrosObjetivos, podeVerObjetivos],
  );

  const tarefasFiltradas = useMemo(
    () => aplicarFiltrosLocais(tarefasBase, filtrosTarefas),
    [tarefasBase, filtrosTarefas],
  );

  const cardsKanban = useMemo(
    () =>
      tarefasFiltradas
        .map(mapTarefaToKanbanCard)
        .sort((a, b) => {
          if (a.emAtraso && !b.emAtraso) return -1;
          if (!a.emAtraso && b.emAtraso) return 1;

          const prazo =
            prazoTimestamp(a.prazo, a.horaEntrega) -
            prazoTimestamp(b.prazo, b.horaEntrega);
          if (prazo !== 0) return prazo;

          const prioridade =
            prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
          if (prioridade !== 0) return prioridade;

          return a.titulo.localeCompare(b.titulo);
        }),
    [tarefasFiltradas],
  );

  const diasSemana = useMemo(
    () => organizarSemana(tarefasFiltradas),
    [tarefasFiltradas],
  );

  const tarefasPaiOptions = useMemo(
    () =>
      itens
        .filter((item) => item.tipo === "pai")
        .map((item) => ({
          id: item.id,
          titulo: item.titulo,
        })),
    [itens],
  );

  async function recarregarDetalheAtual(tarefaId: string) {
    const resultado = await buscarTarefa({ tarefaId });

    if (!resultado.sucesso || !resultado.data) {
      throw new Error(
        resultado.mensagem || "Não foi possível recarregar a tarefa.",
      );
    }

    setTarefaAtual(resultado.data);
    upsertListaComDetalhe(resultado.data);
  }

  function upsertListaComDetalhe(detalhe: TarefaDetalhe) {
    setItensState((current) => {
      const baseAtualizada = detalheParaTarefaBase(detalhe);
      const existe = current.some((item) => item.id === detalhe.id);

      if (!existe) {
        return [baseAtualizada, ...current];
      }

      return current.map((item) =>
        item.id === detalhe.id ? baseAtualizada : item,
      );
    });
  }

  function formatarPrioridadeLabel(prioridade: string | null) {
    if (!prioridade) return "Sem prioridade";
    if (prioridade === "media") return "Média";
    return prioridade.charAt(0).toUpperCase() + prioridade.slice(1);
  }

  function classePrioridadeObjetivo(prioridade: string | null) {
    switch (prioridade) {
      case "urgente":
        return "border-red-800/60 bg-red-950/40 text-red-200";
      case "alta":
        return "border-amber-800/60 bg-amber-950/40 text-amber-200";
      case "media":
        return "border-sky-800/60 bg-sky-950/40 text-sky-200";
      case "baixa":
        return "border-zinc-700 bg-zinc-900 text-zinc-300";
      default:
        return "border-zinc-700 bg-zinc-900 text-zinc-400";
    }
  }

  function iniciaisNome(nome: string) {
    return nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? "")
      .join("");
  }

  async function abrirTarefaPorId(
    tarefaId: string,
    mode: "view" | "edit" = "view",
  ) {
    setErroAcao(null);
    setLoadingTarefa(true);

    try {
      const resultado = await buscarTarefa({ tarefaId });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível carregar a tarefa.",
        );
      }

      setTarefaAtual(resultado.data);
      setModal({
        open: true,
        mode,
        tipo: resultado.data.tipo,
        tarefaId,
      });
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao abrir tarefa.",
      );
    } finally {
      setLoadingTarefa(false);
    }
  }

  function fecharModal() {
    setModal({ open: false });
    setTarefaAtual(null);
    setErroAcao(null);
  }

  async function criarNovaTarefa(values: CriarTarefaInput) {
  setErroAcao(null);
  setSubmittingModal(true);

  try {
    console.log("Payload criarNovaTarefa:", values);

    const resultado = await criarTarefa(values);

    console.log("Resultado criarNovaTarefa:", resultado);

    if (!resultado.sucesso || !resultado.data) {
      throw new Error(
        resultado.mensagem || "Não foi possível criar a tarefa.",
      );
    }

    upsertListaComDetalhe(resultado.data);
    fecharModal();
  } catch (error) {
    console.error("Erro em criarNovaTarefa:", error);

    setErroAcao(
      error instanceof Error ? error.message : `Erro ao criar tarefa: ${String(error)}`,
    );
  } finally {
    setSubmittingModal(false);
  }
}

  async function salvarEdicaoTarefa(values: Omit<EditarTarefaInput, "id">) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await editarTarefa({
        ...values,
        id: tarefaAtual.id,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível editar a tarefa.",
        );
      }

      const detalhe = resultado.data;

      setTarefaAtual(detalhe);

      setItensState((atual) =>
        atual.map((item) => {
          if (item.id !== detalhe.id) return item;

          return {
            ...item,
            titulo: detalhe.titulo,
            descricao: detalhe.descricao,
            prioridade: detalhe.prioridade,
            status: detalhe.status,
            dataEntrega: detalhe.dataEntrega,
            horaEntrega: detalhe.horaEntrega,
            dataConclusao: detalhe.dataConclusao,
            dataAtualizacao: detalhe.dataAtualizacao,
            responsaveis:
              detalhe.responsaveis?.length > 0
                ? detalhe.responsaveis.map((responsavel) => ({
                    id: responsavel.id,
                    nome: responsavel.nome,
                    avatarUrl: responsavel.avatarUrl ?? null,
                  }))
                : item.responsaveis,
            equipe:
              detalhe.tipo !== "pai"
                ? (detalhe.equipe ?? item.equipe)
                : item.equipe,
            categoria:
              detalhe.tipo !== "pai"
                ? (detalhe.categoria ?? item.categoria)
                : item.categoria,
          } as typeof item;
        }),
      );

      fecharModal();
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao editar tarefa.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleAtualizarStatus(novoStatus: StatusTarefa) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await moverTarefaStatus({
        id: tarefaAtual.id,
        novoStatus,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível atualizar o status.",
        );
      }

      setTarefaAtual(resultado.data);
      upsertListaComDetalhe(resultado.data);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao atualizar status.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function moverCardKanban(
    cardId: string,
    novoStatus: TarefaKanbanCard["status"],
  ) {
    setErroAcao(null);

    try {
      const resultado = await moverTarefaStatus({
        id: cardId,
        novoStatus,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível mover a tarefa.",
        );
      }

      setItensState((atual) =>
        atual.map((item) =>
          item.id === cardId
            ? {
                ...item,
                status: resultado.data!.status,
                dataConclusao: resultado.data!.dataConclusao ?? null,
                dataAtualizacao: resultado.data!.dataAtualizacao,
              }
            : item,
        ),
      );

      if (tarefaAtual?.id === cardId) {
        setTarefaAtual((atual) =>
          atual
            ? {
                ...atual,
                status: resultado.data!.status,
                dataConclusao: resultado.data!.dataConclusao ?? null,
                dataAtualizacao: resultado.data!.dataAtualizacao,
              }
            : atual,
        );
      }
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao mover tarefa no kanban.",
      );
    }
  }

  async function handleReabrir(
    novoStatus: Exclude<StatusTarefa, "concluida" | "em_atraso">,
  ) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await reabrirTarefa({
        id: tarefaAtual.id,
        novoStatus,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível reabrir a tarefa.",
        );
      }

      setTarefaAtual(resultado.data);
      upsertListaComDetalhe(resultado.data);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao reabrir tarefa.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleExcluirTarefa() {
    if (!tarefaAtual || tarefaAtual.tipo === "pai") return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await excluirTarefa({
        id: tarefaAtual.id,
      });

      if (!resultado.sucesso) {
        throw new Error(
          resultado.mensagem || "Não foi possível excluir a tarefa.",
        );
      }

      setItensState((current) =>
        current.filter((item) => item.id !== tarefaAtual.id),
      );
      fecharModal();
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao excluir tarefa.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleAdicionarComentario(values: {
    conteudo: string;
    linkExterno?: string | null;
    comentarioPaiId?: string | null;
  }) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setProcessingComment(true);

    try {
      const resultado = await adicionarComentario({
        tarefaId: tarefaAtual.id,
        comentarioPaiId: values.comentarioPaiId ?? null,
        conteudo: values.conteudo,
        linkExterno: values.linkExterno ?? null,
      });

      if (!resultado.sucesso) {
        throw new Error(
          resultado.mensagem || "Não foi possível adicionar o comentário.",
        );
      }

      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(
        error instanceof Error
          ? error.message
          : "Erro ao adicionar comentário.",
      );
    } finally {
      setProcessingComment(false);
    }
  }

  async function handleEditarComentario(values: {
    comentarioId: string;
    conteudo: string;
    linkExterno?: string | null;
  }) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setProcessingComment(true);

    try {
      const resultado = await editarComentario({
        comentarioId: values.comentarioId,
        conteudo: values.conteudo,
        linkExterno: values.linkExterno ?? null,
      });

      if (!resultado.sucesso) {
        throw new Error(
          resultado.mensagem || "Não foi possível editar o comentário.",
        );
      }

      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao editar comentário.",
      );
    } finally {
      setProcessingComment(false);
    }
  }


  
  async function handleExcluirComentario(comentarioId: string) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setProcessingComment(true);

    try {
      const resultado = await excluirComentario({ comentarioId });

      if (!resultado.sucesso) {
        throw new Error(
          resultado.mensagem || "Não foi possível excluir o comentário.",
        );
      }

      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao excluir comentário.",
      );
    } finally {
      setProcessingComment(false);
    }
  }


  return (
    <div className="space-y-6">
      <section
        className="rounded-3xl p-6 shadow-sm"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-1)]">
            Tarefas
          </h1>
          <p className="max-w-3xl text-sm text-[var(--text-3)]">
            Acompanhe objetivos, tarefas de objetivo e tarefas do módulo em uma
            visão operacional mais clara e organizada.
          </p>
        </div>
      </section>

      {erroInicial ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            border: "1px solid #6b2328",
            backgroundColor: "#2a1316",
            color: "#fecaca",
          }}
        >
          {erroInicial}
        </div>
      ) : null}

      {erroAcao ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            border: "1px solid #6b2328",
            backgroundColor: "#2a1316",
            color: "#fecaca",
          }}
        >
          {erroAcao}
        </div>
      ) : null}

      {loadingTarefa ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
          Carregando tarefa...
        </div>
      ) : null}

      {podeVerObjetivos ? (
        <section
          className="rounded-[28px] p-4 shadow-sm backdrop-blur-sm md:p-5"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--text-1)]">
                  Objetivos
                </h2>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px]"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface-0)",
                    color: "var(--text-3)",
                  }}
                >
                  {objetivos.length}
                </span>
              </div>

              <p className="mt-1 text-sm text-[var(--text-3)]">
                Objetivos ficam separados das tarefas operacionais para facilitar o
                acompanhamento estratégico.
              </p>
            </div>

            {podeCriarObjetivos ? (
              <button
                type="button"
                onClick={() => setModal({ open: true, mode: "create", tipo: "pai" })}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium transition"
                style={{
                  backgroundColor: "var(--button-primary)",
                  color: "var(--button-primary-foreground)",
                  border: "1px solid transparent",
                }}
              >
                Adicionar objetivo
              </button>
            ) : null}
          </div>

          <TarefasFilters
            contexto="objetivos"
            filtros={filtrosObjetivos}
            usuarios={usuariosIniciais}
            onChange={setFiltrosObjetivos}
            compact
          />

          <div className="mt-4">
            {objetivos.length > 0 ? (
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-4">
                  {objetivos.map((objetivo) => {
                    const resumo = calcularResumoObjetivo(objetivo.id, tarefasBase);

                    return (
                      <button
                        key={objetivo.id}
                        type="button"
                        onClick={() => abrirTarefaPorId(objetivo.id, "view")}
                        className="group w-[340px] flex-shrink-0 rounded-[24px] p-4 text-left transition hover:-translate-y-[1px]"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-medium ${corTipoLabel(
                                objetivo.tipo,
                              )}`}
                            >
                              {formatarTipoLabel(objetivo.tipo)}
                            </span>

                            <span
                              className="inline-flex rounded-lg px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--surface-0)",
                                color: "var(--text-2)",
                              }}
                            >
                              {formatarStatusLabel(objetivo.status)}
                            </span>
                          </div>

                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-medium ${classePrioridadeObjetivo(
                              objetivo.prioridade,
                            )}`}
                          >
                            {formatarPrioridadeLabel(objetivo.prioridade)}
                          </span>
                        </div>

                        <h3 className="mt-4 line-clamp-2 text-[15px] font-semibold leading-6 text-[var(--text-1)]">
                          {objetivo.titulo}
                        </h3>

                        {objetivo.descricao ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--text-3)]">
                            {objetivo.descricao}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-[var(--text-4)]">
                            Sem descrição adicionada.
                          </p>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div
                            className="rounded-2xl px-3 py-2.5"
                            style={{
                              border: "1px solid var(--border)",
                              backgroundColor: "var(--surface-3)",
                            }}
                          >
                            <span className="block text-[10px] uppercase tracking-[0.14em] text-[var(--text-4)]">
                              Status
                            </span>
                            <span className="mt-1 block text-sm text-[var(--text-2)]">
                              {formatarStatusLabel(objetivo.status)}
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
                              Prazo
                            </span>
                            <span className="mt-1 block text-sm text-[var(--text-2)]">
                              {formatarDataPadrao(objetivo.dataEntrega) || "Sem prazo"}
                            </span>
                          </div>
                        </div>

                        <div
                          className="mt-4 rounded-2xl px-3 py-3"
                          style={{
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--surface-3)",
                          }}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-4)]">
                              Progresso
                            </span>
                            <span className="text-xs font-medium text-[var(--text-2)]">
                              {resumo.percentual}%
                            </span>
                          </div>

                          <div
                            className="h-2 overflow-hidden rounded-full"
                            style={{ backgroundColor: "var(--surface-0)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${resumo.percentual}%`,
                                background:
                                  resumo.percentual === 100
                                    ? "#22c55e"
                                    : resumo.percentual > 0
                                    ? "#60a5fa"
                                    : "var(--border)",
                              }}
                            />
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className="rounded-lg px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--surface-0)",
                                color: "var(--text-2)",
                              }}
                            >
                              {resumo.total} tarefas
                            </span>

                            <span
                              className="rounded-lg px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--surface-0)",
                                color: "var(--text-2)",
                              }}
                            >
                              {resumo.concluidas} concluídas
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          {objetivo.responsaveis?.length ? (
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {objetivo.responsaveis.slice(0, 4).map((responsavel) => (
                                  <div
                                    key={responsavel.id}
                                    title={responsavel.nome}
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold text-[var(--text-2)]"
                                    style={{
                                      border: "1px solid var(--border)",
                                      backgroundColor: "var(--surface-1)",
                                    }}
                                  >
                                    {iniciaisNome(responsavel.nome)}
                                  </div>
                                ))}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-xs text-[var(--text-2)]">
                                  {objetivo.responsaveis[0]?.nome}
                                  {objetivo.responsaveis.length > 1
                                    ? ` +${objetivo.responsaveis.length - 1}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-3)]">Sem responsáveis</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 text-sm text-[var(--text-3)]"
                style={{
                  border: "1px dashed var(--border)",
                  backgroundColor: "var(--surface-0)",
                }}
              >
                Nenhum objetivo encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section
        className="rounded-[28px] p-4 shadow-sm backdrop-blur-sm md:p-5"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-1)]">
                Tarefas
              </h2>
              <span
                className="rounded-full px-2.5 py-1 text-[11px]"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface-0)",
                  color: "var(--text-3)",
                }}
              >
                {tarefasFiltradas.length}
              </span>
            </div>

            <p className="mt-1 text-sm text-[var(--text-3)]">
              Acompanhe tarefas de objetivo e tarefas avulsas nas diferentes
              visualizações do módulo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModal({ open: true, mode: "create", tipo: "orfa" })}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium transition"
            style={{
              backgroundColor: "var(--button-primary)",
              color: "var(--button-primary-foreground)",
              border: "1px solid transparent",
            }}
          >
            Adicionar tarefa
          </button>
        </div>

        <TarefasFilters
          contexto="tarefas"
          filtros={filtrosTarefas}
          usuarios={usuariosIniciais}
          onChange={setFiltrosTarefas}
          compact
        />

        <div className="mt-4">
          <div className="px-1">
            <TarefasViewSwitcher value={view} onChange={setView} />
          </div>

          <div
            className="rounded-b-[24px] rounded-tr-[24px] p-3 md:p-4"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-0)",
            }}
          >
            {view === "kanban" ? (
              tarefasFiltradas.length > 0 ? (
                <TarefasKanban
                  cards={cardsKanban}
                  onOpenTask={(taskId) => abrirTarefaPorId(taskId, "view")}
                  onMoveTask={moverCardKanban}
                  hideTipoBadge={!podeVerObjetivos}
                  showEquipeBadge={podeVerTodasEquipes}
                />
              ) : (
                <div
                  className="rounded-2xl p-6 text-sm text-[var(--text-3)]"
                  style={{
                    border: "1px dashed var(--border)",
                    backgroundColor: "var(--surface-0)",
                  }}
                >
                  Nenhuma tarefa encontrada com os filtros atuais.
                </div>
              )
            ) : view === "table" ? (
              tarefasFiltradas.length > 0 ? (
                <TarefasTable
                  tarefas={tarefasFiltradas}
                  onOpenTask={(taskId) => abrirTarefaPorId(taskId, "view")}
                />
              ) : (
                <div
                  className="rounded-2xl p-6 text-sm text-[var(--text-3)]"
                  style={{
                    border: "1px dashed var(--border)",
                    backgroundColor: "var(--surface-0)",
                  }}
                >
                  Nenhuma tarefa encontrada com os filtros atuais.
                </div>
              )
            ) : tarefasFiltradas.length > 0 ? (
              <TarefasWeekCalendar
                dias={diasSemana}
                onOpenTask={(taskId) => abrirTarefaPorId(taskId, "view")}
              />
            ) : (
              <div
                className="rounded-2xl p-6 text-sm text-[var(--text-3)]"
                style={{
                  border: "1px dashed var(--border)",
                  backgroundColor: "var(--surface-0)",
                }}
              >
                Nenhuma tarefa encontrada com os filtros atuais.
              </div>
            )}
          </div>
        </div>
      </section>

      {modal.open && modal.tipo === "pai" ? (
        <TarefaPaiModal
          open
          mode={modal.mode}
          tarefa={tarefaAtual?.tipo === "pai" ? tarefaAtual : null}
          usuarios={usuariosIniciais}
          usuarioAtualId={usuarioAtual?.id ?? null}
          podeModerarComentarios
          onClose={fecharModal}
          onEditRequest={() => {
            if (!tarefaAtual || tarefaAtual.tipo !== "pai") return;
            setModal({
              open: true,
              mode: "edit",
              tipo: "pai",
              tarefaId: tarefaAtual.id,
            });
          }}
          onViewRequest={() => {
            if (!tarefaAtual || tarefaAtual.tipo !== "pai") return;
            setModal({
              open: true,
              mode: "view",
              tipo: "pai",
              tarefaId: tarefaAtual.id,
            });
          }}
          onAtualizarStatus={handleAtualizarStatus}
          onReabrir={handleReabrir}
          onSubmit={async (values: PayloadModalPai) => {
            if (modal.mode === "create") {
              await criarNovaTarefa(values as CriarTarefaInput);
              return;
            }

            await salvarEdicaoTarefa(
              values as Omit<EditarTarefaInput, "id">,
            );
          }}
          onAddFilha={() => {
            if (!tarefaAtual || tarefaAtual.tipo !== "pai") return;
            setModal({ open: true, mode: "create", tipo: "filha" });
          }}
          onAdicionarComentario={handleAdicionarComentario}
          onEditarComentario={handleEditarComentario}
          onExcluirComentario={handleExcluirComentario}
        />
      ) : null}

      {modal.open && (modal.tipo === "filha" || modal.tipo === "orfa") ? (
        <TarefaOperacionalModal
          open
          mode={modal.mode}
          tipo={modal.tipo}
          tarefa={
            tarefaAtual &&
            (tarefaAtual.tipo === "filha" || tarefaAtual.tipo === "orfa")
              ? tarefaAtual
              : null
          }
          usuarios={usuariosIniciais}
          usuarioAtualId={usuarioAtual?.id ?? null}
          podeModerarComentarios
          equipes={equipesIniciais}
          categorias={categoriasIniciais}
          tarefasPaiOptions={tarefasPaiOptions}
          onClose={fecharModal}
          onEditRequest={() => {
            if (
              !tarefaAtual ||
              (tarefaAtual.tipo !== "filha" && tarefaAtual.tipo !== "orfa")
            ) {
              return;
            }

            setModal({
              open: true,
              mode: "edit",
              tipo: tarefaAtual.tipo,
              tarefaId: tarefaAtual.id,
            });
          }}
          onViewRequest={() => {
            if (
              !tarefaAtual ||
              (tarefaAtual.tipo !== "filha" && tarefaAtual.tipo !== "orfa")
            ) {
              return;
            }

            setModal({
              open: true,
              mode: "view",
              tipo: tarefaAtual.tipo,
              tarefaId: tarefaAtual.id,
            });
          }}
          onAtualizarStatus={handleAtualizarStatus}
          onReabrir={handleReabrir}
          onExcluir={handleExcluirTarefa}
          onSubmit={async (values: PayloadModalOperacional) => {
            if (modal.mode === "create") {
              await criarNovaTarefa(values as CriarTarefaInput);
              return;
            }

            await salvarEdicaoTarefa(
              values as Omit<EditarTarefaInput, "id">,
            );
          }}
          onAdicionarComentario={handleAdicionarComentario}
          onEditarComentario={handleEditarComentario}
          onExcluirComentario={handleExcluirComentario}
        />
      ) : null}

      {submittingModal || processingComment ? (
        <div
          className="fixed bottom-4 right-4 rounded-2xl px-4 py-3 text-sm shadow-xl"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-1)",
            color: "var(--text-2)",
          }}
        >
          {submittingModal
            ? "Salvando alterações..."
            : "Atualizando comentários..."}
        </div>
      ) : null}
    </div>
  );

}