"use server";

import { buscarUsuarioAtualTarefas } from "@/actions/tarefas/buscar-usuario-atual-tarefas";
import { listarTarefas } from "@/actions/tarefas/listar-tarefas";
import type {
  ResultadoOperacaoTarefa,
  Tarefa,
  TarefaChecklistItem,
  TarefaDashboardCard,
  TarefaDashboardData,
  TarefasPaginadas,
} from "@/types/tarefas/tarefas.types";

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

function prazoTimestamp(dataEntrega: string, horaEntrega: string | null) {
  return new Date(
    horaEntrega ? `${dataEntrega}T${horaEntrega}:00` : `${dataEntrega}T23:59:59`,
  ).getTime();
}

function formatarDiaSemana(dataIso: string) {
  const data = new Date(`${dataIso}T00:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(data);
}

function mapTarefaParaDashboardCard(tarefa: Tarefa): TarefaDashboardCard {
  return {
    id: tarefa.id,
    titulo: tarefa.titulo,
    status: tarefa.status,
    prioridade: tarefa.prioridade,
    prazo: tarefa.dataEntrega,
    horaEntrega: tarefa.horaEntrega,
    categoria:
      tarefa.tipo === "pai" || !tarefa.categoria
        ? null
        : {
            id: tarefa.categoria.id,
            nome: tarefa.categoria.nome,
          },
    equipe:
      tarefa.tipo === "pai" || !tarefa.equipe
        ? null
        : {
            id: tarefa.equipe.id,
            nome: tarefa.equipe.nome,
            cor: tarefa.equipe.cor ?? null,
          },
    responsaveis:
      "responsaveis" in tarefa &&
      Array.isArray((tarefa as Tarefa & { responsaveis?: unknown[] }).responsaveis)
        ? (
            tarefa as Tarefa & {
              responsaveis?: Array<{
                id: string;
                nome: string;
                avatarUrl?: string | null;
              }>;
            }
          ).responsaveis?.map((responsavel) => ({
            id: responsavel.id,
            nome: responsavel.nome,
            avatarUrl: responsavel.avatarUrl ?? null,
          })) ?? []
        : [],
    emAtraso: tarefa.status === "em_atraso",
  };
}

function mapPaiParaChecklist(tarefa: Tarefa): TarefaChecklistItem[] {
  if (
    "filhas" in tarefa &&
    Array.isArray((tarefa as Tarefa & { filhas?: unknown[] }).filhas)
  ) {
    return (tarefa as Tarefa & { filhas: TarefaChecklistItem[] }).filhas;
  }

  return [];
}

export async function carregarDashboardTarefas(): Promise<
  ResultadoOperacaoTarefa<TarefaDashboardData>
> {
  try {
    const resultadoUsuario = await buscarUsuarioAtualTarefas();

    if (!resultadoUsuario.sucesso) {
      return {
        sucesso: false,
        mensagem: resultadoUsuario.mensagem,
      };
    }

    const usuarioAtual = resultadoUsuario.data;

    if (!usuarioAtual) {
      return {
        sucesso: false,
        mensagem: "Usuário atual não encontrado.",
      };
    }

    const resultadoTarefas = await listarTarefas({
      ocultarConcluidas: false,
      pagina: 1,
      limite: 200,
    });

    if (!resultadoTarefas.sucesso || !resultadoTarefas.data) {
      return {
        sucesso: false,
        mensagem:
          resultadoTarefas.mensagem ||
          "Não foi possível carregar tarefas para o dashboard.",
      };
    }

    const itens = (resultadoTarefas.data as TarefasPaginadas<Tarefa>).itens ?? [];

    const minhasTarefas = itens.filter((tarefa) => {
      if (!("responsaveis" in tarefa)) return false;

      const responsaveis =
        (tarefa as Tarefa & {
          responsaveis?: Array<{ id: string }>;
        }).responsaveis ?? [];

      return responsaveis.some((responsavel) => responsavel.id === usuarioAtual.id);
    });

    const cardsMinhas = minhasTarefas.map(mapTarefaParaDashboardCard);

    const atrasadas = cardsMinhas
      .filter((item) => item.emAtraso && item.status !== "concluida")
      .sort((a, b) => {
        const prazo =
          prazoTimestamp(a.prazo, a.horaEntrega) -
          prazoTimestamp(b.prazo, b.horaEntrega);
        if (prazo !== 0) return prazo;

        return prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
      });

    const diasMap = new Map<string, TarefaDashboardCard[]>();

    for (const item of cardsMinhas.filter(
      (card) => !card.emAtraso && card.status !== "concluida",
    )) {
      const atual = diasMap.get(item.prazo) ?? [];
      atual.push(item);
      diasMap.set(item.prazo, atual);
    }

    const dias = Array.from(diasMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, tarefas]) => ({
        diaSemana: formatarDiaSemana(data),
        data,
        tarefas: tarefas.sort((a, b) => {
          const prioridade =
            prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
          if (prioridade !== 0) return prioridade;

          return (
            prazoTimestamp(a.prazo, a.horaEntrega) -
            prazoTimestamp(b.prazo, b.horaEntrega)
          );
        }),
      }));

    const aFazer = cardsMinhas
      .filter((item) =>
        ["a_fazer", "em_andamento", "atencao"].includes(item.status),
      )
      .sort((a, b) => {
        if (a.emAtraso && !b.emAtraso) return -1;
        if (!a.emAtraso && b.emAtraso) return 1;

        const prazo =
          prazoTimestamp(a.prazo, a.horaEntrega) -
          prazoTimestamp(b.prazo, b.horaEntrega);
        if (prazo !== 0) return prazo;

        return prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
      });

    const podeVerMacros = [
      "admin_supremo",
      "coordenador_geral",
      "coordenador_equipe",
    ].includes(usuarioAtual.perfil);

    const macros = podeVerMacros
      ? itens
          .filter((tarefa) => tarefa.tipo === "pai")
          .map((tarefa) => {
            const filhas = mapPaiParaChecklist(tarefa);
            const concluidas = filhas.filter(
              (filha) => filha.status === "concluida",
            ).length;

            return {
              id: tarefa.id,
              titulo: tarefa.titulo,
              totalFilhas: filhas.length,
              totalFilhasConcluidas: concluidas,
              percentualConclusao:
                filhas.length === 0 ? 0 : Math.round((concluidas / filhas.length) * 100),
              filhas: [...filhas].sort((a, b) => {
                if (a.status === "em_atraso" && b.status !== "em_atraso") return -1;
                if (a.status !== "em_atraso" && b.status === "em_atraso") return 1;
                if (a.status !== "concluida" && b.status === "concluida") return -1;
                if (a.status === "concluida" && b.status !== "concluida") return 1;

                return a.dataEntrega.localeCompare(b.dataEntrega);
              }),
            };
          })
      : [];

    return {
      sucesso: true,
      mensagem: "Dashboard de tarefas carregado com sucesso.",
      data: {
        minhasTarefasSemana: {
          atrasadas,
          dias,
        },
        minhasTarefasAFazer: {
          itens: aFazer,
        },
        acompanhamentoMacros:
          macros.length > 0
            ? {
                itens: macros,
              }
            : null,
      },
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Erro ao carregar dashboard de tarefas.",
    };
  }
}