import type { PerfilUsuario } from "@/types/configuracoes/usuarios.types";

type UsuarioProjeto = {
  id: string;
  perfil: PerfilUsuario;
  status: "ativo" | "inativo";
};

type ProjetoPermissaoContexto = {
  coordenador_id: string;
};

function usuarioAtivo(
  usuario: UsuarioProjeto | null | undefined,
): usuario is UsuarioProjeto {
  return !!usuario && usuario.status === "ativo";
}

export function podeCriarProjeto(usuario: UsuarioProjeto | null | undefined) {
  if (!usuarioAtivo(usuario)) return false;

  return (
    usuario.perfil === "admin_supremo" ||
    usuario.perfil === "coordenador_geral"
  );
}

export function podeListarProjetos(usuario: UsuarioProjeto | null | undefined) {
  if (!usuarioAtivo(usuario)) return false;

  return [
    "admin_supremo",
    "coordenador_geral",
    "coordenador_equipe",
    "assistente",
    "membro",
  ].includes(usuario.perfil);
}

export function podeVisualizarProjeto(
  usuario: UsuarioProjeto | null | undefined,
  projeto: ProjetoPermissaoContexto | null | undefined,
) {
  if (!usuarioAtivo(usuario) || !projeto) return false;

  if (
    usuario.perfil === "admin_supremo" ||
    usuario.perfil === "coordenador_geral"
  ) {
    return true;
  }

  return projeto.coordenador_id === usuario.id;
}

export function podeEditarProjeto(
  usuario: UsuarioProjeto | null | undefined,
  projeto: ProjetoPermissaoContexto | null | undefined,
) {
  return podeVisualizarProjeto(usuario, projeto);
}

export function podeAlterarStatusProjeto(
  usuario: UsuarioProjeto | null | undefined,
  projeto: ProjetoPermissaoContexto | null | undefined,
) {
  return podeVisualizarProjeto(usuario, projeto);
}

export function podeAlterarCoordenadorProjeto(
  usuario: UsuarioProjeto | null | undefined,
) {
  if (!usuarioAtivo(usuario)) return false;

  return (
    usuario.perfil === "admin_supremo" ||
    usuario.perfil === "coordenador_geral"
  );
}

export function podeCriarRubricaGlobalNoProjeto(
  usuario: UsuarioProjeto | null | undefined,
) {
  if (!usuarioAtivo(usuario)) return false;

  return (
    usuario.perfil === "admin_supremo" ||
    usuario.perfil === "coordenador_geral" ||
    usuario.perfil === "gestor_financeiro"
  );
}

export function podeEditarRubricasProjeto(
  usuario: UsuarioProjeto | null | undefined,
  projeto: ProjetoPermissaoContexto | null | undefined,
) {
  return podeEditarProjeto(usuario, projeto);
}