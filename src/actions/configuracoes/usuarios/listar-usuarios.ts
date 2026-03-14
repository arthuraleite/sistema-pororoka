"use server";

import { UsuariosService } from "@/services/configuracoes/usuarios.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function listarUsuariosAction() {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const service = new UsuariosService();

    const usuarios = await service.listar(usuarioAtual);

    return {
      sucesso: true,
      dados: usuarios,
      erro: null,
    };
  } catch (error) {
    return {
      sucesso: false,
      dados: [],
      erro: error instanceof Error ? error.message : "Erro ao listar usuários.",
    };
  }
}