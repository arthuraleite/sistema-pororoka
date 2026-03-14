"use server";

import { EquipesService } from "@/services/configuracoes/equipes.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function listarEquipesAction() {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const service = new EquipesService();

    const equipes = await service.listar(usuarioAtual);

    return {
      sucesso: true,
      dados: equipes,
      erro: null,
    };
  } catch (error) {
    return {
      sucesso: false,
      dados: [],
      erro: error instanceof Error ? error.message : "Erro ao listar equipes.",
    };
  }
}