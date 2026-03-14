"use server";

import { EquipesService } from "@/services/configuracoes/equipes.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function buscarEquipeAction(id: string) {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const service = new EquipesService();

    const equipe = await service.buscar(usuarioAtual, id);

    return {
      sucesso: true,
      dados: equipe,
      erro: null,
    };
  } catch (error) {
    return {
      sucesso: false,
      dados: null,
      erro: error instanceof Error ? error.message : "Erro ao buscar equipe.",
    };
  }
}