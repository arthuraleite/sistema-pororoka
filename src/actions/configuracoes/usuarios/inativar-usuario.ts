"use server";

import { UsuariosService } from "@/services/configuracoes/usuarios.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function inativarUsuarioAction(id: string) {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const service = new UsuariosService();

    const usuario = await service.alterarStatus(usuarioAtual, {
      id,
      status: "inativo",
    });

    return {
      sucesso: true,
      dados: usuario,
      erro: null,
    };
  } catch (error) {
    return {
      sucesso: false,
      dados: null,
      erro: error instanceof Error ? error.message : "Erro ao inativar usuário.",
    };
  }
}