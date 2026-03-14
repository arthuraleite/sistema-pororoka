"use server";

import { usuarioCreateSchema } from "@/schemas/configuracoes/usuario-create.schema";
import { UsuariosService } from "@/services/configuracoes/usuarios.service";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";

export async function cadastrarUsuarioAction(input: unknown) {
  try {
    const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
    const parsed = usuarioCreateSchema.parse(input);

    const service = new UsuariosService();
    const usuario = await service.cadastrar(usuarioAtual, {
      nome: parsed.nome,
      email: parsed.email,
      perfil: parsed.perfil,
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
      erro: error instanceof Error ? error.message : "Erro ao cadastrar usuário.",
    };
  }
}