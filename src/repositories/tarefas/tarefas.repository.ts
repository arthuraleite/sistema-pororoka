import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  StatusTarefa,
  Tarefa,
  TarefaChecklistItem,
  TarefaComentario,
  TarefaDetalhe,
  TarefaLink,
  TarefaResponsavelResumo,
  TarefasFiltros,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type ListarTarefasParams = {
  filtros?: TarefasFiltros;
  pagina?: number;
  limite?: number;
};

type EquipeRow =
  | {
      id: string;
      nome: string;
    }
  | Array<{
      id: string;
      nome: string;
    }>
  | null;

type CategoriaRow =
  | {
      id: string;
      nome: string;
      equipe_id: string;
      ativo: boolean;
    }
  | Array<{
      id: string;
      nome: string;
      equipe_id: string;
      ativo: boolean;
    }>
  | null;

type ResponsavelPorTarefaRow = {
  tarefa_id: string;
  usuario:
    | {
        id: string;
        nome: string;
        avatar_url?: string | null;
      }
    | Array<{
        id: string;
        nome: string;
        avatar_url?: string | null;
      }>
    | null;
};

type UsuarioDetalheRow =
  | {
      id: string;
      nome: string;
      email: string;
      avatar_url?: string | null;
      perfil:
        | "admin_supremo"
        | "coordenador_geral"
        | "gestor_financeiro"
        | "coordenador_equipe"
        | "assistente"
        | "membro"
        | "analista_financeiro";
      status: "ativo" | "inativo";
      equipe_id: string | null;
    }
  | Array<{
      id: string;
      nome: string;
      email: string;
      avatar_url?: string | null;
      perfil:
        | "admin_supremo"
        | "coordenador_geral"
        | "gestor_financeiro"
        | "coordenador_equipe"
        | "assistente"
        | "membro"
        | "analista_financeiro";
      status: "ativo" | "inativo";
      equipe_id: string | null;
    }>
  | null;

type ComentarioAutorRow =
  | {
      id: string;
      nome: string;
      avatar_url?: string | null;
    }
  | Array<{
      id: string;
      nome: string;
      avatar_url?: string | null;
    }>
  | null;

type TarefaPaiResumoRow =
  | {
      id: string;
      titulo: string;
    }
  | Array<{
      id: string;
      titulo: string;
    }>
  | null;

type TarefaLinkRow = {
  id: string;
  tarefa_id: string;
  url: string;
  texto: string | null;
  criado_por_id: string;
  data_criacao: string;
  data_atualizacao: string | null;
};

type TarefaComentarioRow = {
  id: string;
  tarefa_id: string;
  comentario_pai_id: string | null;
  autor_id: string;
  conteudo: string;
  link_externo: string | null;
  editado: boolean;
  data_criacao: string;
  data_atualizacao: string | null;
  autor?: ComentarioAutorRow;
};

type TarefaResponsavelListagemRelRow = {
  usuario_id?: string;
};

type TarefaResponsavelDetalheRelRow = {
  usuario?: UsuarioDetalheRow;
};

type FilhaRow = {
  id: string;
  titulo: string;
  status: StatusTarefa;
  prioridade: "urgente" | "alta" | "media" | "baixa" | null;
  data_entrega: string;
  hora_entrega: string | null;
};

type TarefaRow = {
  id: string;
  tipo: "pai" | "filha" | "orfa";
  escopo_objetivo: "global" | "equipe" | null;
  titulo: string;
  descricao: string | null;
  projeto_id: string | null;
  tarefa_pai_id: string | null;
  equipe_id: string | null;
  categoria_id: string | null;
  prioridade: "urgente" | "alta" | "media" | "baixa" | null;
  status: StatusTarefa;
  data_entrega: string;
  hora_entrega: string | null;
  data_conclusao: string | null;
  criado_por_id: string;
  atualizado_por_id: string | null;
  data_criacao: string;
  data_atualizacao: string;
  equipe?: EquipeRow;
  categoria?: CategoriaRow;
  responsaveis_rel?: TarefaResponsavelListagemRelRow[] | null;
};

type TarefaRowDetalhe = Omit<TarefaRow, "responsaveis_rel"> & {
  responsaveis_rel?: TarefaResponsavelDetalheRelRow[] | null;
  links_rel?: TarefaLinkRow[] | null;
  comentarios_rel?: TarefaComentarioRow[] | null;
  tarefa_pai?: TarefaPaiResumoRow;
  filhas_rel?: FilhaRow[] | null;
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapFilhas(rows: FilhaRow[] | null | undefined): TarefaChecklistItem[] {
  return (rows ?? []).map((filha) => ({
    id: filha.id,
    titulo: filha.titulo,
    status: filha.status,
    prioridade: filha.prioridade,
    dataEntrega: filha.data_entrega,
    horaEntrega: filha.hora_entrega,
  }));
}

function mapUsuariosDetalhe(
  rows: TarefaRowDetalhe["responsaveis_rel"],
): UsuarioResumoTarefa[] {
  return (rows ?? [])
    .map((item) => firstOrNull(item.usuario ?? null))
    .filter(
      (
        usuario,
      ): usuario is {
        id: string;
        nome: string;
        email: string;
        avatar_url?: string | null;
        perfil:
          | "admin_supremo"
          | "coordenador_geral"
          | "gestor_financeiro"
          | "coordenador_equipe"
          | "assistente"
          | "membro"
          | "analista_financeiro";
        status: "ativo" | "inativo";
        equipe_id: string | null;
      } => Boolean(usuario),
    )
    .map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      avatarUrl: usuario.avatar_url ?? null,
      perfil: usuario.perfil,
      status: usuario.status,
      equipeId: usuario.equipe_id,
      equipeNome: null,
    }));
}

function mapLinks(rows: TarefaRowDetalhe["links_rel"]): TarefaLink[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    tarefaId: row.tarefa_id,
    url: row.url,
    texto: row.texto,
    criadoPorId: row.criado_por_id,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
  }));
}

function mapComentarios(
  rows: TarefaRowDetalhe["comentarios_rel"],
): TarefaComentario[] {
  type ComentarioMapeado = TarefaComentario;

  const comentariosBase: ComentarioMapeado[] = (rows ?? []).map((row) => {
    const autor = firstOrNull(row.autor ?? null);

    return {
      id: row.id,
      tarefaId: row.tarefa_id,
      comentarioPaiId: row.comentario_pai_id,
      autorId: row.autor_id,
      autorNome: autor?.nome ?? "Usuário",
      autorAvatarUrl: autor?.avatar_url ?? null,
      conteudo: row.conteudo,
      linkExterno: row.link_externo,
      editado: row.editado,
      dataCriacao: row.data_criacao,
      dataAtualizacao: row.data_atualizacao,
      respostas: [],
    };
  });

  const mapa = new Map<string, ComentarioMapeado>(
    comentariosBase.map((comentario) => [comentario.id, comentario]),
  );

  const raiz: ComentarioMapeado[] = [];

  for (const comentario of comentariosBase) {
    if (comentario.comentarioPaiId) {
      const pai = mapa.get(comentario.comentarioPaiId);
      if (pai) {
        pai.respostas.push(comentario);
        continue;
      }
    }

    raiz.push(comentario);
  }

  return raiz;
}

function mapTarefaRow(
  row: TarefaRow,
  responsaveisMap?: Map<string, TarefaResponsavelResumo[]>,
): Tarefa {
  const equipe = firstOrNull(row.equipe ?? null);
  const categoria = firstOrNull(row.categoria ?? null);

  if (row.tipo === "pai") {
    return {
      id: row.id,
      tipo: "pai",
      escopoObjetivo: row.escopo_objetivo ?? "global",
      titulo: row.titulo,
      descricao: row.descricao,
      projetoId: row.projeto_id,
      tarefaPaiId: null,
      equipeId: row.equipe_id,
      equipe: equipe
        ? {
            id: equipe.id,
            nome: equipe.nome,
            cor: null,
          }
        : null,
      categoriaId: null,
      categoria: null,
      prioridade: row.prioridade,
      status: row.status,
      dataEntrega: row.data_entrega,
      horaEntrega: row.hora_entrega,
      dataConclusao: row.data_conclusao,
      criadoPorId: row.criado_por_id,
      atualizadoPorId: row.atualizado_por_id,
      dataCriacao: row.data_criacao,
      dataAtualizacao: row.data_atualizacao,
      responsaveis: responsaveisMap?.get(row.id) ?? [],
      filhas: [],
    };
  }

  return {
    id: row.id,
    tipo: row.tipo,
    escopoObjetivo: null,
    titulo: row.titulo,
    descricao: row.descricao,
    projetoId: row.projeto_id,
    tarefaPaiId: row.tarefa_pai_id,
    equipeId: row.equipe_id!,
    categoriaId: row.categoria_id!,
    prioridade: row.prioridade,
    status: row.status,
    dataEntrega: row.data_entrega,
    horaEntrega: row.hora_entrega,
    dataConclusao: row.data_conclusao,
    criadoPorId: row.criado_por_id,
    atualizadoPorId: row.atualizado_por_id,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
    equipe: equipe
      ? {
          id: equipe.id,
          nome: equipe.nome,
          cor: null,
        }
      : null,
    categoria: categoria
      ? {
          id: categoria.id,
          nome: categoria.nome,
          equipeId: categoria.equipe_id,
          ativo: categoria.ativo,
        }
      : null,
    responsaveis: responsaveisMap?.get(row.id) ?? [],
    filhas: undefined,
  } as Tarefa;
}

function mapTarefaDetalheRow(row: TarefaRowDetalhe): TarefaDetalhe {
  const equipe = firstOrNull(row.equipe ?? null);
  const categoria = firstOrNull(row.categoria ?? null);
  const tarefaPai = firstOrNull(row.tarefa_pai ?? null);

  const base = {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo,
    descricao: row.descricao,
    projetoId: row.projeto_id,
    prioridade: row.prioridade,
    status: row.status,
    dataEntrega: row.data_entrega,
    horaEntrega: row.hora_entrega,
    dataConclusao: row.data_conclusao,
    criadoPorId: row.criado_por_id,
    atualizadoPorId: row.atualizado_por_id,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
    responsaveis: mapUsuariosDetalhe(row.responsaveis_rel),
    links: mapLinks(row.links_rel),
    comentarios: mapComentarios(row.comentarios_rel),
  };

  if (row.tipo === "pai") {
    return {
      ...base,
      tipo: "pai",
      escopoObjetivo: row.escopo_objetivo ?? "global",
      tarefaPaiId: null,
      tarefaPai: undefined,
      equipeId: row.equipe_id,
      equipe: equipe
        ? {
            id: equipe.id,
            nome: equipe.nome,
            cor: null,
          }
        : null,
      categoriaId: null,
      categoria: null,
      filhas: mapFilhas(row.filhas_rel),
    };
  }

  if (row.tipo === "filha") {
    return {
      ...base,
      tipo: "filha",
      escopoObjetivo: null,
      tarefaPaiId: row.tarefa_pai_id!,
      tarefaPai: tarefaPai
        ? {
            id: tarefaPai.id,
            titulo: tarefaPai.titulo,
          }
        : null,
      equipeId: row.equipe_id!,
      equipe: equipe
        ? {
            id: equipe.id,
            nome: equipe.nome,
            cor: null,
          }
        : null,
      categoriaId: row.categoria_id!,
      categoria: categoria
        ? {
            id: categoria.id,
            nome: categoria.nome,
            equipeId: categoria.equipe_id,
            ativo: categoria.ativo,
          }
        : null,
      filhas: undefined,
    };
  }

  return {
    ...base,
    tipo: "orfa",
    escopoObjetivo: null,
    tarefaPaiId: null,
    tarefaPai: null,
    equipeId: row.equipe_id!,
    equipe: equipe
      ? {
          id: equipe.id,
          nome: equipe.nome,
          cor: null,
        }
      : null,
    categoriaId: row.categoria_id!,
    categoria: categoria
      ? {
          id: categoria.id,
          nome: categoria.nome,
          equipeId: categoria.equipe_id,
          ativo: categoria.ativo,
        }
      : null,
    filhas: undefined,
  };
}

type QueryLike = {
  ilike: (column: string, value: string) => QueryLike;
  in: (column: string, values: readonly string[]) => QueryLike;
  gte: (column: string, value: string) => QueryLike;
  lte: (column: string, value: string) => QueryLike;
  neq: (column: string, value: string) => QueryLike;
  eq: (column: string, value: string) => QueryLike;
  order: (column: string, options?: { ascending?: boolean }) => QueryLike;
  range: (from: number, to: number) => QueryLike;
  or: (
    filters: string,
    options?: { foreignTable?: string },
  ) => QueryLike;
};

function applyFiltros(query: QueryLike, filtros?: TarefasFiltros): QueryLike {
  let current = query;

  if (!filtros) return current;

  if (filtros.busca?.trim()) {
    const termo = filtros.busca.trim();
    current = current.or(`titulo.ilike.%${termo}%,descricao.ilike.%${termo}%`);
  }

  if (filtros.status?.length) {
    current = current.in("status", filtros.status);
  }

  if (filtros.prioridades?.length) {
    current = current.in("prioridade", filtros.prioridades);
  }

  if (filtros.categoriaIds?.length) {
    current = current.in("categoria_id", filtros.categoriaIds);
  }

  if (filtros.equipeIds?.length) {
    current = current.in("equipe_id", filtros.equipeIds);
  }

  if (filtros.responsavelIds?.length) {
    const filtroResponsaveis = filtros.responsavelIds
      .map((id) => `usuario_id.eq.${id}`)
      .join(",");

    current = current.or(filtroResponsaveis, {
      foreignTable: "responsaveis_rel",
    });
  }

  if (filtros.dataInicio) {
    current = current.gte("data_entrega", filtros.dataInicio);
  }

  if (filtros.dataFim) {
    current = current.lte("data_entrega", filtros.dataFim);
  }

  if (filtros.ocultarConcluidas) {
    current = current.neq("status", "concluida");
  }

  if (filtros.apenasAtrasadas) {
    current = current.eq("status", "em_atraso");
  }

  if (filtros.apenasMacros) {
    current = current.eq("tipo", "pai");
  }

  if (filtros.apenasOperacionais) {
    current = current.in("tipo", ["filha", "orfa"]);
  }

  return current;
}

function applyOrdenacaoPadrao(query: QueryLike): QueryLike {
  return query
    .order("data_entrega", { ascending: true })
    .order("data_criacao", { ascending: false });
}

function agruparResponsaveisPorTarefa(
  rows: ResponsavelPorTarefaRow[] | null | undefined,
): Map<string, TarefaResponsavelResumo[]> {
  const mapa = new Map<string, TarefaResponsavelResumo[]>();

  for (const row of rows ?? []) {
    const usuario = firstOrNull(row.usuario ?? null);
    if (!usuario) continue;

    const atual = mapa.get(row.tarefa_id) ?? [];
    atual.push({
      id: usuario.id,
      nome: usuario.nome,
      avatarUrl: usuario.avatar_url ?? null,
    });
    mapa.set(row.tarefa_id, atual);
  }

  return mapa;
}

export class TarefasRepository {
  constructor(private readonly supabase: ClienteSupabase) {}

  async listar(params?: ListarTarefasParams) {
    const pagina = params?.pagina ?? 1;
    const limite = params?.limite ?? 50;
    const from = (pagina - 1) * limite;
    const to = from + limite - 1;

    const query = this.supabase.from("tarefas").select(
      `
        id,
        tipo,
        escopo_objetivo,
        titulo,
        descricao,
        projeto_id,
        tarefa_pai_id,
        equipe_id,
        categoria_id,
        prioridade,
        status,
        data_entrega,
        hora_entrega,
        data_conclusao,
        criado_por_id,
        atualizado_por_id,
        data_criacao,
        data_atualizacao,
        equipe:equipes!fk_tarefas_equipe (
          id,
          nome
        ),
        categoria:categorias_tarefa!fk_tarefas_categoria_equipe (
          id,
          nome,
          equipe_id,
          ativo
        ),
        responsaveis_rel:tarefas_responsaveis (
          usuario_id
        )
      `,
      { count: "exact" },
    );

    const queryComFiltros = applyFiltros(
      query as unknown as QueryLike,
      params?.filtros,
    );

    const queryOrdenada = applyOrdenacaoPadrao(queryComFiltros);

    const queryFinal = (queryOrdenada as unknown as QueryLike).range(from, to);

    const { data, error, count } = await (queryFinal as unknown as typeof query);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as unknown as TarefaRow[];
    const tarefaIds = rows.map((row) => row.id);

    let responsaveisMap = new Map<string, TarefaResponsavelResumo[]>();

    if (tarefaIds.length > 0) {
      const { data: responsaveisData, error: responsaveisError } =
        await this.supabase
          .from("tarefas_responsaveis")
          .select(
            `
              tarefa_id,
              usuario:usuarios!fk_tarefas_responsaveis_usuario (
                id,
                nome,
                avatar_url
              )
            `,
          )
          .in("tarefa_id", tarefaIds);

      if (responsaveisError) {
        throw responsaveisError;
      }

      responsaveisMap = agruparResponsaveisPorTarefa(
        (responsaveisData ?? []) as ResponsavelPorTarefaRow[],
      );
    }

    const itens = rows.map((row) => mapTarefaRow(row, responsaveisMap));

    return {
      itens,
      total: count ?? 0,
      pagina,
      limite,
      totalPaginas: Math.ceil((count ?? 0) / limite),
    };
  }

  async buscarPorId(id: string): Promise<TarefaDetalhe | null> {
    const { data, error } = await this.supabase
      .from("tarefas")
      .select(
        `
          id,
          tipo,
          escopo_objetivo,
          titulo,
          descricao,
          projeto_id,
          tarefa_pai_id,
          equipe_id,
          categoria_id,
          prioridade,
          status,
          data_entrega,
          hora_entrega,
          data_conclusao,
          criado_por_id,
          atualizado_por_id,
          data_criacao,
          data_atualizacao,
          equipe:equipes!fk_tarefas_equipe (
            id,
            nome
          ),
          categoria:categorias_tarefa!fk_tarefas_categoria_equipe (
            id,
            nome,
            equipe_id,
            ativo
          ),
          responsaveis_rel:tarefas_responsaveis (
            usuario:usuarios!fk_tarefas_responsaveis_usuario (
              id,
              nome,
              email,
              avatar_url,
              perfil,
              status,
              equipe_id
            )
          ),
          links_rel:tarefas_links (
            id,
            tarefa_id,
            url,
            texto,
            criado_por_id,
            data_criacao,
            data_atualizacao
          ),
          comentarios_rel:tarefas_comentarios (
            id,
            tarefa_id,
            comentario_pai_id,
            autor_id,
            conteudo,
            link_externo,
            editado,
            data_criacao,
            data_atualizacao,
            autor:usuarios!fk_tarefas_comentarios_autor (
              id,
              nome,
              avatar_url
            )
          )
        `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const row = data as unknown as TarefaRowDetalhe;

    if (row.tipo === "pai") {
      const { data: filhasData, error: filhasError } = await this.supabase
        .from("tarefas")
        .select(
          `
            id,
            titulo,
            status,
            prioridade,
            data_entrega,
            hora_entrega
          `,
        )
        .eq("tarefa_pai_id", row.id)
        .eq("tipo", "filha")
        .order("data_entrega", { ascending: true });

      if (filhasError) {
        throw filhasError;
      }

      row.filhas_rel = ((filhasData ?? []) as unknown as FilhaRow[]) ?? [];
    }

    if (row.tarefa_pai_id) {
      const { data: tarefaPaiData, error: tarefaPaiError } = await this.supabase
        .from("tarefas")
        .select("id, titulo")
        .eq("id", row.tarefa_pai_id)
        .maybeSingle();

      if (tarefaPaiError) {
        throw tarefaPaiError;
      }

      row.tarefa_pai = tarefaPaiData
        ? (tarefaPaiData as unknown as TarefaPaiResumoRow)
        : null;
    } else {
      row.tarefa_pai = null;
    }

    return mapTarefaDetalheRow(row);
  }
}
