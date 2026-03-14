import type {
  AcaoConfiguracoes,
  UsuarioAutorizadoConfiguracoes,
} from "@/types/configuracoes/configuracoes.types";

const PERFIS_ACESSO_MODULO = ["admin_supremo", "coordenador_geral"] as const;

export function podeAcessarModuloConfiguracoes(
  usuario: UsuarioAutorizadoConfiguracoes | null | undefined,
) {
  if (!usuario) return false;
  if (usuario.status !== "ativo") return false;

  return PERFIS_ACESSO_MODULO.includes(
    usuario.perfil as (typeof PERFIS_ACESSO_MODULO)[number],
  );
}

export function podeExecutarAcaoConfiguracoes(
  usuario: UsuarioAutorizadoConfiguracoes | null | undefined,
  acao: AcaoConfiguracoes,
  alvoUsuarioId?: string,
) {
  if (!usuario) return false;
  if (!podeAcessarModuloConfiguracoes(usuario)) return false;

  switch (acao) {
    case "listar_usuarios":
    case "ver_usuario":
    case "cadastrar_usuario":
    case "listar_equipes":
    case "ver_equipe":
      return usuario.perfil === "admin_supremo" || usuario.perfil === "coordenador_geral";

    case "editar_usuario":
    case "alterar_perfil_usuario":
    case "inativar_usuario":
    case "reativar_usuario":
    case "cadastrar_equipe":
    case "editar_equipe":
      if (usuario.perfil !== "admin_supremo") return false;
      if (acao === "alterar_perfil_usuario" && alvoUsuarioId && alvoUsuarioId === usuario.id) {
        return false;
      }
      return true;

    default:
      return false;
  }
}