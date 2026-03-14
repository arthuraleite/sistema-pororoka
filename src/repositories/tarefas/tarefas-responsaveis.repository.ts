import type { SupabaseClient } from "@supabase/supabase-js";

import type { TarefaResponsavel, UUID } from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type TarefaResponsavelRow = {
  id: string;
  tarefa_id: string;
  usuario_id: string;
  atribuido_por_id: string;
  data_criacao: string;
};

function mapResponsavel(row: TarefaResponsavelRow): TarefaResponsavel {
  return {
    id: row.id,
    tarefaId: row.tarefa_id,
    usuarioId: row.usuario_id,
    atribuidoPorId: row.atribuido_por_id,
    dataCriacao: row.data_criacao,
  };
}

export class TarefasResponsaveisRepository {
  constructor(private readonly supabase: ClienteSupabase) {}

  async listarPorTarefa(tarefaId: UUID): Promise<TarefaResponsavel[]> {
    const { data, error } = await this.supabase
      .from("tarefas_responsaveis")
      .select("*")
      .eq("tarefa_id", tarefaId)
      .order("data_criacao", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapResponsavel);
  }

  async adicionar(
    tarefaId: UUID,
    usuarioId: UUID,
    atribuidoPorId: UUID,
  ): Promise<TarefaResponsavel> {
    const { data, error } = await this.supabase
      .from("tarefas_responsaveis")
      .insert({
        tarefa_id: tarefaId,
        usuario_id: usuarioId,
        atribuido_por_id: atribuidoPorId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapResponsavel(data);
  }

  async adicionarVarios(
    tarefaId: UUID,
    usuarioIds: UUID[],
    atribuidoPorId: UUID,
  ): Promise<TarefaResponsavel[]> {
    if (!usuarioIds.length) return [];

    const { data, error } = await this.supabase
      .from("tarefas_responsaveis")
      .insert(
        usuarioIds.map((usuarioId) => ({
          tarefa_id: tarefaId,
          usuario_id: usuarioId,
          atribuido_por_id: atribuidoPorId,
        })),
      )
      .select("*");

    if (error) throw error;
    return (data ?? []).map(mapResponsavel);
  }

  async remover(tarefaId: UUID, usuarioId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("tarefas_responsaveis")
      .delete()
      .eq("tarefa_id", tarefaId)
      .eq("usuario_id", usuarioId);

    if (error) throw error;
  }

  async removerPorTarefa(tarefaId: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("tarefas_responsaveis")
      .delete()
      .eq("tarefa_id", tarefaId);

    if (error) throw error;
  }
}