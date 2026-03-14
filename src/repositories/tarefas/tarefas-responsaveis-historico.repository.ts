import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TarefaResponsavelHistorico,
  TarefaResponsavelHistoricoEvento,
  UUID,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type TarefaResponsavelHistoricoRow = {
  id: string;
  tarefa_id: string;
  usuario_afetado_id: string;
  alterado_por_id: string;
  tipo_evento: TarefaResponsavelHistoricoEvento;
  data_evento: string;
};

function mapHistorico(
  row: TarefaResponsavelHistoricoRow,
): TarefaResponsavelHistorico {
  return {
    id: row.id,
    tarefaId: row.tarefa_id,
    usuarioAfetadoId: row.usuario_afetado_id,
    alteradoPorId: row.alterado_por_id,
    tipoEvento: row.tipo_evento,
    dataEvento: row.data_evento,
  };
}

export class TarefasResponsaveisHistoricoRepository {
  constructor(private readonly supabase: ClienteSupabase) {}

  async listarPorTarefa(tarefaId: UUID): Promise<TarefaResponsavelHistorico[]> {
    const { data, error } = await this.supabase
      .from("tarefas_responsaveis_historico")
      .select("*")
      .eq("tarefa_id", tarefaId)
      .order("data_evento", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapHistorico);
  }

  async registrar(input: {
    tarefaId: UUID;
    usuarioAfetadoId: UUID;
    alteradoPorId: UUID;
    tipoEvento: TarefaResponsavelHistoricoEvento;
  }): Promise<TarefaResponsavelHistorico> {
    const { data, error } = await this.supabase
      .from("tarefas_responsaveis_historico")
      .insert({
        tarefa_id: input.tarefaId,
        usuario_afetado_id: input.usuarioAfetadoId,
        alterado_por_id: input.alteradoPorId,
        tipo_evento: input.tipoEvento,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapHistorico(data);
  }

  async registrarLote(
    eventos: Array<{
      tarefaId: UUID;
      usuarioAfetadoId: UUID;
      alteradoPorId: UUID;
      tipoEvento: TarefaResponsavelHistoricoEvento;
    }>,
  ): Promise<TarefaResponsavelHistorico[]> {
    if (!eventos.length) return [];

    const { data, error } = await this.supabase
      .from("tarefas_responsaveis_historico")
      .insert(
        eventos.map((evento) => ({
          tarefa_id: evento.tarefaId,
          usuario_afetado_id: evento.usuarioAfetadoId,
          alterado_por_id: evento.alteradoPorId,
          tipo_evento: evento.tipoEvento,
        })),
      )
      .select("*");

    if (error) throw error;
    return (data ?? []).map(mapHistorico);
  }
}