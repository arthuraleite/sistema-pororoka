import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TarefaNotificacao,
  TipoNotificacaoTarefa,
  UUID,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type TarefaNotificacaoRow = {
  id: string;
  usuario_id: string;
  tarefa_id: string;
  comentario_id: string | null;
  tipo: TipoNotificacaoTarefa;
  titulo: string;
  descricao: string | null;
  lida: boolean;
  data_criacao: string;
  data_expiracao: string;
};

function mapNotificacao(row: TarefaNotificacaoRow): TarefaNotificacao {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    tarefaId: row.tarefa_id,
    comentarioId: row.comentario_id,
    tipo: row.tipo,
    titulo: row.titulo,
    descricao: row.descricao,
    lida: row.lida,
    dataCriacao: row.data_criacao,
    dataExpiracao: row.data_expiracao,
  };
}

export class TarefasNotificacoesRepository {
  constructor(private readonly supabase: ClienteSupabase) {}

  async listarMinhas(params?: {
    somenteNaoLidas?: boolean;
    limite?: number;
  }): Promise<TarefaNotificacao[]> {
    let query = this.supabase
      .from("tarefas_notificacoes")
      .select("*")
      .order("data_criacao", { ascending: false });

    if (params?.somenteNaoLidas) {
      query = query.eq("lida", false);
    }

    if (params?.limite) {
      query = query.limit(params.limite);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map(mapNotificacao);
  }

  async marcarComoLida(id: UUID): Promise<TarefaNotificacao> {
    const { data, error } = await this.supabase
      .from("tarefas_notificacoes")
      .update({ lida: true })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return mapNotificacao(data);
  }

  async marcarTodasComoLidas(): Promise<void> {
    const { error } = await this.supabase
      .from("tarefas_notificacoes")
      .update({ lida: true })
      .eq("lida", false);

    if (error) throw error;
  }

  async criarComoBackend(input: {
    usuarioId: UUID;
    tarefaId: UUID;
    comentarioId?: UUID | null;
    tipo: TipoNotificacaoTarefa;
    titulo: string;
    descricao?: string | null;
    dataExpiracao?: string;
  }): Promise<TarefaNotificacao> {
    const { data, error } = await this.supabase
      .from("tarefas_notificacoes")
      .insert({
        usuario_id: input.usuarioId,
        tarefa_id: input.tarefaId,
        comentario_id: input.comentarioId ?? null,
        tipo: input.tipo,
        titulo: input.titulo,
        descricao: input.descricao ?? null,
        data_expiracao: input.dataExpiracao,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapNotificacao(data);
  }

  async excluirExpiradas(agoraIso: string): Promise<void> {
    const { error } = await this.supabase
      .from("tarefas_notificacoes")
      .delete()
      .lte("data_expiracao", agoraIso);

    if (error) throw error;
  }
}