import type { SupabaseClient } from "@supabase/supabase-js";

import { TarefasRepository } from "@/repositories/tarefas/tarefas.repository";
import { TarefasResponsaveisHistoricoRepository } from "@/repositories/tarefas/tarefas-responsaveis-historico.repository";
import { TarefasResponsaveisRepository } from "@/repositories/tarefas/tarefas-responsaveis.repository";
import type {
  Tarefa,
  TarefaResponsavel,
  UUID,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

function perfilPodeSerResponsavelDeTarefaPai(
  perfil: UsuarioResumoTarefa["perfil"],
): perfil is "admin_supremo" | "coordenador_geral" | "coordenador_equipe" {
  return (
    perfil === "admin_supremo" ||
    perfil === "coordenador_geral" ||
    perfil === "coordenador_equipe"
  );
}

export class TarefasResponsaveisService {
  private readonly tarefasRepository: TarefasRepository;
  private readonly responsaveisRepository: TarefasResponsaveisRepository;
  private readonly historicoRepository: TarefasResponsaveisHistoricoRepository;

  constructor(private readonly supabase: ClienteSupabase) {
    this.tarefasRepository = new TarefasRepository(supabase);
    this.responsaveisRepository = new TarefasResponsaveisRepository(supabase);
    this.historicoRepository = new TarefasResponsaveisHistoricoRepository(
      supabase,
    );
  }

  async listarPorTarefa(tarefaId: UUID): Promise<TarefaResponsavel[]> {
    return this.responsaveisRepository.listarPorTarefa(tarefaId);
  }

  async validarAoMenosUmResponsavel(responsavelIds: UUID[]): Promise<void> {
    if (!responsavelIds.length) {
      throw new Error("A tarefa deve ter ao menos um responsável.");
    }
  }

  async validarResponsaveisParaTarefa(params: {
    tarefa: Tarefa;
    responsavelIds: UUID[];
    usuariosDisponiveis: UsuarioResumoTarefa[];
  }): Promise<void> {
    const { tarefa, responsavelIds, usuariosDisponiveis } = params;

    await this.validarAoMenosUmResponsavel(responsavelIds);

    const usuariosPorId = new Map(usuariosDisponiveis.map((u) => [u.id, u]));

    for (const responsavelId of responsavelIds) {
      const usuario = usuariosPorId.get(responsavelId);

      if (!usuario) {
        throw new Error("Responsável informado não está disponível.");
      }

      if (usuario.status !== "ativo") {
        throw new Error("Não é permitido atribuir tarefa a usuário inativo.");
      }

      if (usuario.perfil === "analista_financeiro") {
        throw new Error(
          "Usuário com perfil analista_financeiro não pode participar do módulo de tarefas.",
        );
      }

      if (tarefa.tipo === "pai") {
        if (!perfilPodeSerResponsavelDeTarefaPai(usuario.perfil)) {
          throw new Error(
            "Tarefa-pai só pode ter responsáveis que tenham acesso à própria tarefa-pai.",
          );
        }
      }
    }
  }

  async sincronizarResponsaveis(params: {
    tarefaId: UUID;
    responsavelIdsFinais: UUID[];
    alteradoPorId: UUID;
  }): Promise<{
    atuais: TarefaResponsavel[];
    adicionados: UUID[];
    removidos: UUID[];
  }> {
    const { tarefaId, responsavelIdsFinais, alteradoPorId } = params;

    await this.validarAoMenosUmResponsavel(responsavelIdsFinais);

    const atuais = await this.responsaveisRepository.listarPorTarefa(tarefaId);

    const atuaisIds = atuais.map((item) => item.usuarioId);
    const atuaisSet = new Set(atuaisIds);
    const finaisSet = new Set(responsavelIdsFinais);

    const adicionados = responsavelIdsFinais.filter((id) => !atuaisSet.has(id));
    const removidos = atuaisIds.filter((id) => !finaisSet.has(id));

    for (const usuarioId of removidos) {
      await this.responsaveisRepository.remover(tarefaId, usuarioId);
    }

    if (adicionados.length) {
      await this.responsaveisRepository.adicionarVarios(
        tarefaId,
        adicionados,
        alteradoPorId,
      );
    }

    const eventos = [
      ...adicionados.map((usuarioAfetadoId) => ({
        tarefaId,
        usuarioAfetadoId,
        alteradoPorId,
        tipoEvento: "adicionado" as const,
      })),
      ...removidos.map((usuarioAfetadoId) => ({
        tarefaId,
        usuarioAfetadoId,
        alteradoPorId,
        tipoEvento: "removido" as const,
      })),
    ];

    if (eventos.length) {
      await this.historicoRepository.registrarLote(eventos);
    }

    const finais = await this.responsaveisRepository.listarPorTarefa(tarefaId);

    return {
      atuais: finais,
      adicionados,
      removidos,
    };
  }

  async atribuirNaCriacao(params: {
    tarefaId: UUID;
    responsavelIds: UUID[];
    alteradoPorId: UUID;
  }): Promise<TarefaResponsavel[]> {
    const { tarefaId, responsavelIds, alteradoPorId } = params;

    await this.validarAoMenosUmResponsavel(responsavelIds);

    const responsaveis = await this.responsaveisRepository.adicionarVarios(
      tarefaId,
      responsavelIds,
      alteradoPorId,
    );

    await this.historicoRepository.registrarLote(
      responsavelIds.map((usuarioAfetadoId) => ({
        tarefaId,
        usuarioAfetadoId,
        alteradoPorId,
        tipoEvento: "adicionado" as const,
      })),
    );

    return responsaveis;
  }

  async obterIdsResponsaveis(tarefaId: UUID): Promise<UUID[]> {
    const responsaveis = await this.responsaveisRepository.listarPorTarefa(
      tarefaId,
    );
    return responsaveis.map((item) => item.usuarioId);
  }

  async buscarTarefaObrigatoria(tarefaId: UUID): Promise<Tarefa> {
    const tarefa = await this.tarefasRepository.buscarPorId(tarefaId);

    if (!tarefa) {
      throw new Error("Tarefa não encontrada.");
    }

    return tarefa;
  }
}