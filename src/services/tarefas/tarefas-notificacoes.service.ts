import type { SupabaseClient } from "@supabase/supabase-js";

import { TarefasNotificacoesRepository } from "@/repositories/tarefas/tarefas-notificacoes.repository";
import type {
  TarefaNotificacao,
  TipoNotificacaoTarefa,
  UUID,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

export class TarefasNotificacoesService {
  private readonly notificacoesRepository: TarefasNotificacoesRepository;

  constructor(private readonly supabase: ClienteSupabase) {
    this.notificacoesRepository = new TarefasNotificacoesRepository(supabase);
  }

  async listarMinhas(params?: {
    somenteNaoLidas?: boolean;
    limite?: number;
  }): Promise<TarefaNotificacao[]> {
    return this.notificacoesRepository.listarMinhas(params);
  }

  async marcarComoLida(id: UUID): Promise<TarefaNotificacao> {
    return this.notificacoesRepository.marcarComoLida(id);
  }

  async marcarTodasComoLidas(): Promise<void> {
    await this.notificacoesRepository.marcarTodasComoLidas();
  }

  async criarInterna(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    comentarioId?: UUID | null;
    tipo: TipoNotificacaoTarefa;
    titulo: string;
    descricao?: string | null;
    dataExpiracao?: string;
  }): Promise<TarefaNotificacao> {
    return this.notificacoesRepository.criarComoBackend(params);
  }

  async criarLoteInterno(
    itens: Array<{
      usuarioId: UUID;
      tarefaId: UUID;
      comentarioId?: UUID | null;
      tipo: TipoNotificacaoTarefa;
      titulo: string;
      descricao?: string | null;
      dataExpiracao?: string;
    }>,
  ): Promise<TarefaNotificacao[]> {
    const resultados: TarefaNotificacao[] = [];

    for (const item of itens) {
      const notificacao = await this.notificacoesRepository.criarComoBackend(
        item,
      );
      resultados.push(notificacao);
    }

    return resultados;
  }

  async excluirExpiradas(agora?: Date): Promise<void> {
    const referencia = agora ?? new Date();
    await this.notificacoesRepository.excluirExpiradas(
      referencia.toISOString(),
    );
  }

  montarNotificacaoNovaAtribuicao(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    tituloTarefa: string;
  }) {
    return {
      usuarioId: params.usuarioId,
      tarefaId: params.tarefaId,
      tipo: "nova_atribuicao" as const,
      titulo: "Nova tarefa atribuída a você",
      descricao: `Você foi atribuído à tarefa "${params.tituloTarefa}".`,
    };
  }

  montarNotificacaoResponsavelAlterado(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    tituloTarefa: string;
  }) {
    return {
      usuarioId: params.usuarioId,
      tarefaId: params.tarefaId,
      tipo: "responsavel_alterado_para_mim" as const,
      titulo: "Você foi adicionado como responsável",
      descricao: `Seu vínculo de responsabilidade foi atualizado na tarefa "${params.tituloTarefa}".`,
    };
  }

  montarNotificacaoComentario(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    comentarioId: UUID;
    tituloTarefa: string;
  }) {
    return {
      usuarioId: params.usuarioId,
      tarefaId: params.tarefaId,
      comentarioId: params.comentarioId,
      tipo: "comentario_em_tarefa_acompanhada" as const,
      titulo: "Novo comentário em tarefa acompanhada",
      descricao: `Houve um novo comentário na tarefa "${params.tituloTarefa}".`,
    };
  }

  montarNotificacaoRespostaComentario(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    comentarioId: UUID;
    tituloTarefa: string;
  }) {
    return {
      usuarioId: params.usuarioId,
      tarefaId: params.tarefaId,
      comentarioId: params.comentarioId,
      tipo: "resposta_ao_meu_comentario" as const,
      titulo: "Responderam seu comentário",
      descricao: `Houve uma resposta ao seu comentário na tarefa "${params.tituloTarefa}".`,
    };
  }

  montarNotificacaoPrazoProximo(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    tituloTarefa: string;
  }) {
    return {
      usuarioId: params.usuarioId,
      tarefaId: params.tarefaId,
      tipo: "prazo_proximo" as const,
      titulo: "Prazo da tarefa se aproxima",
      descricao: `A tarefa "${params.tituloTarefa}" está próxima do prazo.`,
    };
  }

  montarNotificacaoTarefaEmAtraso(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    tituloTarefa: string;
  }) {
    return {
      usuarioId: params.usuarioId,
      tarefaId: params.tarefaId,
      tipo: "tarefa_em_atraso" as const,
      titulo: "Sua tarefa está em atraso",
      descricao: `A tarefa "${params.tituloTarefa}" está em atraso.`,
    };
  }

  montarNotificacaoTarefaReaberta(params: {
    usuarioId: UUID;
    tarefaId: UUID;
    tituloTarefa: string;
  }) {
    return {
      usuarioId: params.usuarioId,
      tarefaId: params.tarefaId,
      tipo: "tarefa_reaberta" as const,
      titulo: "Tarefa reaberta",
      descricao: `A tarefa "${params.tituloTarefa}" foi reaberta.`,
    };
  }
}