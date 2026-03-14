"use server";

import { usuarioEditSchema } from "@/schemas/configuracoes/usuario-edit.schema";
import { UsuariosService } from "@/services/configuracoes/usuarios.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function editarUsuarioAction(input: unknown) {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const parsed = usuarioEditSchema.parse(input);

    const service = new UsuariosService();
    const usuario = await service.editar(usuarioAtual, {
      id: parsed.id,
      nome: parsed.nome,
      email: parsed.email,
      equipeId: parsed.equipeId,
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
      erro: error instanceof Error ? error.message : "Erro ao editar usuário.",
    };
  }
}