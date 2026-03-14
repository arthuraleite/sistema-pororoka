"use server";

import { equipeEditSchema } from "@/schemas/configuracoes/equipe-edit.schema";
import { EquipesService } from "@/services/configuracoes/equipes.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function editarEquipeAction(input: unknown) {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const parsed = equipeEditSchema.parse(input);

    const service = new EquipesService();
    const equipe = await service.editar(usuarioAtual, parsed);

    return {
      sucesso: true,
      dados: equipe,
      erro: null,
    };
  } catch (error) {
    return {
      sucesso: false,
      dados: null,
      erro: error instanceof Error ? error.message : "Erro ao editar equipe.",
    };
  }
}