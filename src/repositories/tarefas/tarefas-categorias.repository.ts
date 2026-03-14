import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CategoriaTarefa,
  CriarCategoriaTarefaInput,
  EditarCategoriaTarefaInput,
  UUID,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type CategoriaTarefaRow = {
  id: string;
  equipe_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  criado_por_id: string;
  atualizado_por_id: string | null;
  data_criacao: string;
  data_atualizacao: string;
};

function mapCategoria(row: CategoriaTarefaRow): CategoriaTarefa {
  return {
    id: row.id,
    equipeId: row.equipe_id,
    nome: row.nome,
    descricao: row.descricao,
    ativo: row.ativo,
    criadoPorId: row.criado_por_id,
    atualizadoPorId: row.atualizado_por_id,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
  };
}

export class TarefasCategoriasRepository {
  constructor(private readonly supabase: ClienteSupabase) {}

  async listar(params?: {
    equipeId?: UUID;
    ativo?: boolean;
  }): Promise<CategoriaTarefa[]> {
    let query = this.supabase
      .from("categorias_tarefa")
      .select("*")
      .order("nome", { ascending: true });

    if (params?.equipeId) {
      query = query.eq("equipe_id", params.equipeId);
    }

    if (typeof params?.ativo === "boolean") {
      query = query.eq("ativo", params.ativo);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(mapCategoria);
  }

  async buscarPorId(id: UUID): Promise<CategoriaTarefa | null> {
    const { data, error } = await this.supabase
      .from("categorias_tarefa")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapCategoria(data) : null;
  }

  async criar(
    input: CriarCategoriaTarefaInput,
    usuarioId: UUID,
  ): Promise<CategoriaTarefa> {
    const { data, error } = await this.supabase
      .from("categorias_tarefa")
      .insert({
        equipe_id: input.equipeId,
        nome: input.nome,
        descricao: input.descricao ?? null,
        criado_por_id: usuarioId,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapCategoria(data);
  }

  async editar(
    input: EditarCategoriaTarefaInput,
    usuarioId: UUID,
  ): Promise<CategoriaTarefa> {
    const { data, error } = await this.supabase
      .from("categorias_tarefa")
      .update({
        nome: input.nome,
        descricao: input.descricao ?? null,
        ativo: input.ativo,
        atualizado_por_id: usuarioId,
      })
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) throw error;
    return mapCategoria(data);
  }

  async desativar(id: UUID, usuarioId: UUID): Promise<CategoriaTarefa> {
    const { data, error } = await this.supabase
      .from("categorias_tarefa")
      .update({
        ativo: false,
        atualizado_por_id: usuarioId,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapCategoria(data);
  }
}