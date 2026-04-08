type UsuarioAutorizadoProjetos = {
  id: string;
  perfil: string;
  status: string;
};

export function podeAcessarModuloProjetos(
  usuario: UsuarioAutorizadoProjetos | null | undefined,
) {
  if (!usuario) return false;
  if (usuario.status !== "ativo") return false;

  return [
    "admin_supremo",
    "coordenador_geral",
    "gestor_financeiro",
    "coordenador_equipe",
    "assistente",
    "membro",
  ].includes(usuario.perfil);
}

export function podeVisualizarTodosProjetos(
  usuario: UsuarioAutorizadoProjetos | null | undefined,
) {
  if (!usuario) return false;
  if (usuario.status !== "ativo") return false;

  return ["admin_supremo", "coordenador_geral", "gestor_financeiro"].includes(
    usuario.perfil,
  );
}

export function podeAdministrarProjetos(
  usuario: UsuarioAutorizadoProjetos | null | undefined,
) {
  if (!usuario) return false;
  if (usuario.status !== "ativo") return false;

  return ["admin_supremo", "coordenador_geral"].includes(usuario.perfil);
}

export function podeVerProjetoComoCoordenador(
  usuario: UsuarioAutorizadoProjetos | null | undefined,
  coordenadorId: string,
) {
  if (!usuario) return false;
  if (usuario.status !== "ativo") return false;

  if (podeVisualizarTodosProjetos(usuario)) return true;

  return usuario.id === coordenadorId;
}