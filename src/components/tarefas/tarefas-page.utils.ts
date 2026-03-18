import type {
  Tarefa,
  TarefaCalendarioDia,
  TarefaCalendarioItem,
  TarefaDetalhe,
  TarefasFiltros,
} from "@/types/tarefas/tarefas.types";

export function prioridadePeso(prioridade: Tarefa["prioridade"]) {
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

export function formatarStatusLabel(status: string) {
  return status
    .replaceAll("_", " ")
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

export function formatarTipoLabel(tipo: "pai" | "filha" | "orfa") {
  if (tipo === "pai") return "Objetivo";
  if (tipo === "filha") return "Tarefa de Objetivo";
  return "Tarefa";
}

export function corTipoLabel(tipo: "pai" | "filha" | "orfa") {
  if (tipo === "pai") {
    return "border-violet-800/60 bg-violet-950/40 text-violet-200";
  }

  if (tipo === "filha") {
    return "border-sky-800/60 bg-sky-950/40 text-sky-200";
  }

  return "border-emerald-800/60 bg-emerald-950/40 text-emerald-200";
}

export function prazoTimestamp(dataEntrega: string, horaEntrega: string | null) {
  return new Date(
    horaEntrega ? `${dataEntrega}T${horaEntrega}:00` : `${dataEntrega}T23:59:59`,
  ).getTime();
}

export function mapResponsaveisResumo(
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

export function calcularResumoObjetivo(
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

export function organizarSemana(itens: Tarefa[]): TarefaCalendarioDia[] {
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

export function aplicarFiltrosLocais(
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

  if (filtros.equipeIds?.length) {
    resultado = resultado.filter((item) => {
      if (item.tipo === "pai") return false;
      if (!item.equipe?.id) return false;

      return filtros.equipeIds?.includes(item.equipe.id);
    });
  }

  if (filtros.categoriaIds?.length) {
    resultado = resultado.filter((item) => {
      if (item.tipo === "pai") return false;
      if (!item.categoria?.id) return false;

      return filtros.categoriaIds?.includes(item.categoria.id);
    });
  }

  if (filtros.busca?.trim()) {
    const termo = filtros.busca.trim().toLowerCase();

    resultado = resultado.filter((item) => {
      const titulo = item.titulo.toLowerCase();
      const descricao = item.descricao?.toLowerCase() ?? "";
      const categoria =
        item.tipo === "pai" ? "" : item.categoria?.nome.toLowerCase() ?? "";
      const equipe = item.equipe?.nome.toLowerCase() ?? "";
      const responsaveis = (item.responsaveis ?? [])
        .map((responsavel) => responsavel.nome.toLowerCase())
        .join(" ");

      return (
        titulo.includes(termo) ||
        descricao.includes(termo) ||
        categoria.includes(termo) ||
        equipe.includes(termo) ||
        responsaveis.includes(termo)
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

export function formatarDataPadrao(data?: string | null) {
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

export function detalheParaTarefaBase(detalhe: TarefaDetalhe): Tarefa {
  const responsaveis = detalhe.responsaveis.map((responsavel) => ({
    id: responsavel.id,
    nome: responsavel.nome,
    avatarUrl: responsavel.avatarUrl ?? null,
  }));

  if (detalhe.tipo === "pai") {
    return {
      id: detalhe.id,
      tipo: "pai",
      escopoObjetivo: detalhe.escopoObjetivo ?? "global",
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
      categoriaId: null,
      categoria: null,
      responsaveis,
      filhas: detalhe.filhas ?? [],
    };
  }

  if (detalhe.tipo === "filha") {
    return {
      id: detalhe.id,
      tipo: "filha",
      escopoObjetivo: null,
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
      responsaveis,
    };
  }

  return {
    id: detalhe.id,
    tipo: "orfa",
    escopoObjetivo: null,
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
    responsaveis,
  };
}