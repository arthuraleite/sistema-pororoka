import type { PerfilUsuario, StatusUsuario } from "@/types/configuracoes/usuarios.types";

export type ConfiguracoesSubarea = "usuarios" | "equipes";

export type AcaoConfiguracoes =
  | "listar_usuarios"
  | "ver_usuario"
  | "cadastrar_usuario"
  | "editar_usuario"
  | "alterar_perfil_usuario"
  | "inativar_usuario"
  | "reativar_usuario"
  | "listar_equipes"
  | "ver_equipe"
  | "cadastrar_equipe"
  | "editar_equipe";

export type UsuarioAutorizadoConfiguracoes = {
  id: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  equipeId: string | null;
};