import { buscarUsuarioPorId } from "@/repositories/usuarios/buscarUsuarioPorId";

export async function verificarAcessoUsuario(id: string) {
  const usuario = await buscarUsuarioPorId(id);

  if (!usuario) {
    return {
      permitido: false,
      motivo: "nao_cadastrado",
    };
  }

  if (usuario.status !== "ativo") {
    return {
      permitido: false,
      motivo: "inativo",
    };
  }

  return {
    permitido: true,
    usuario,
  };
}