import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AdicionarComentarioInput,
  EditarComentarioInput,
  TarefaComentario,
  UUID,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type AutorRow =
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

type TarefaComentarioRow = {
  id: string;
  tarefa_id: string;
  comentario_pai_id: string | null;
  autor_id: string;
  conteudo: string;
  link_externo: string | null;
  editado: boolean;
  data_criacao: string;
  data_atualizacao: string;
  autor?: AutorRow;
};

function firstOrNull<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapComentario(row: TarefaComentarioRow): TarefaComentario {
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
}

export class TarefasComentariosRepository {
  constructor(private readonly supabase: ClienteSupabase) {}

  async listarPorTarefa(tarefaId: UUID): Promise<TarefaComentario[]> {
    const { data, error } = await this.supabase
      .from("tarefas_comentarios")
      .select(
        `
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
        `,
      )
      .eq("tarefa_id", tarefaId)
      .order("data_criacao", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as TarefaComentarioRow[]).map(mapComentario);
  }

  async criar(
    input: AdicionarComentarioInput,
    autorId: UUID,
  ): Promise<TarefaComentario> {
    const { data, error } = await this.supabase
      .from("tarefas_comentarios")
      .insert({
        tarefa_id: input.tarefaId,
        comentario_pai_id: input.comentarioPaiId ?? null,
        autor_id: autorId,
        conteudo: input.conteudo,
        link_externo: input.linkExterno ?? null,
      })
      .select(
        `
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
        `,
      )
      .single();

    if (error) throw error;
    return mapComentario(data as TarefaComentarioRow);
  }

  async editar(
    input: EditarComentarioInput,
    autorId: UUID,
  ): Promise<TarefaComentario> {
    const { data, error } = await this.supabase
      .from("tarefas_comentarios")
      .update({
        conteudo: input.conteudo,
        link_externo: input.linkExterno ?? null,
        editado: true,
      })
      .eq("id", input.comentarioId)
      .eq("autor_id", autorId)
      .select(
        `
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
        `,
      )
      .single();

    if (error) throw error;
    return mapComentario(data as TarefaComentarioRow);
  }

  async buscarPorId(id: UUID): Promise<TarefaComentario | null> {
    const { data, error } = await this.supabase
      .from("tarefas_comentarios")
      .select(
        `
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
        `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapComentario(data as TarefaComentarioRow) : null;
  }

  async excluir(id: UUID): Promise<void> {
    const { error } = await this.supabase
      .from("tarefas_comentarios")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}