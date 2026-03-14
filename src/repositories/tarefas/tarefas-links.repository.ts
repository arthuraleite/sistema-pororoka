import type { SupabaseClient } from "@supabase/supabase-js";

import type { TarefaLink, UUID } from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type LinkInput = {
  id?: UUID;
  url: string;
  texto?: string | null;
};

type TarefaLinkRow = {
  id: string;
  tarefa_id: string;
  url: string;
  texto: string | null;
  criado_por_id: string;
  data_criacao: string;
  data_atualizacao: string;
};

function mapLink(row: TarefaLinkRow): TarefaLink {
  return {
    id: row.id,
    tarefaId: row.tarefa_id,
    url: row.url,
    texto: row.texto,
    criadoPorId: row.criado_por_id,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
  };
}

export class TarefasLinksRepository {
  constructor(private readonly supabase: ClienteSupabase) {}

  async listarPorTarefa(tarefaId: UUID): Promise<TarefaLink[]> {
    const { data, error } = await this.supabase
      .from("tarefas_links")
      .select("*")
      .eq("tarefa_id", tarefaId)
      .order("data_criacao", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapLink);
  }

  async criarVarios(
    tarefaId: UUID,
    links: LinkInput[],
    usuarioId: UUID,
  ): Promise<TarefaLink[]> {
    if (!links.length) return [];

    const { data, error } = await this.supabase
      .from("tarefas_links")
      .insert(
        links.map((link) => ({
          tarefa_id: tarefaId,
          url: link.url,
          texto: link.texto ?? null,
          criado_por_id: usuarioId,
        })),
      )
      .select("*");

    if (error) throw error;
    return (data ?? []).map(mapLink);
  }

  async substituirTodos(
    tarefaId: UUID,
    links: LinkInput[],
    usuarioId: UUID,
  ): Promise<TarefaLink[]> {
    const { error: deleteError } = await this.supabase
      .from("tarefas_links")
      .delete()
      .eq("tarefa_id", tarefaId);

    if (deleteError) throw deleteError;

    if (!links.length) return [];
    return this.criarVarios(tarefaId, links, usuarioId);
  }

  async excluirPorTarefa(tarefaId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("tarefas_links")
      .delete()
      .eq("tarefa_id", tarefaId);

    if (error) throw error;
  }
}