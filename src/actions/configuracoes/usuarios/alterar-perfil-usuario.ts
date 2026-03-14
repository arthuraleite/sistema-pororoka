"use server";

import { usuarioPerfilSchema } from "@/schemas/configuracoes/usuario-perfil.schema";
import { UsuariosService } from "@/services/configuracoes/usuarios.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function alterarPerfilUsuarioAction(input: unknown) {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const parsed = usuarioPerfilSchema.parse(input);

    const service = new UsuariosService();
    const usuario = await service.alterarPerfil(usuarioAtual, {
      id: parsed.id,
      novoPerfil: parsed.novoPerfil,
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
      erro:
        error instanceof Error ? error.message : "Erro ao alterar perfil do usuário.",
    };
  }
}