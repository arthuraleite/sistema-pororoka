"use server";

import { equipeCreateSchema } from "@/schemas/configuracoes/equipe-create.schema";
import { EquipesService } from "@/services/configuracoes/equipes.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function cadastrarEquipeAction(input: unknown) {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const parsed = equipeCreateSchema.parse(input);

    const service = new EquipesService();
    const equipe = await service.criar(usuarioAtual, parsed);

    return {
      sucesso: true,
      dados: equipe,
      erro: null,
    };
  } catch (error) {
    return {
      sucesso: false,
      dados: null,
      erro: error instanceof Error ? error.message : "Erro ao cadastrar equipe.",
    };
  }
}