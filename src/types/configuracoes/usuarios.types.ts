export type PerfilUsuario =
  | "admin_supremo"
  | "coordenador_geral"
  | "gestor_financeiro"
  | "coordenador_equipe"
  | "assistente"
  | "membro"
  | "analista_financeiro";

export type StatusUsuario = "ativo" | "inativo";

export type UsuarioListItem = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  equipeId: string | null;
  equipeNome: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UsuarioDetalhe = UsuarioListItem & {
  inativadoEm?: string | null;
  criadoPor?: string | null;
  atualizadoPor?: string | null;
};

export type UsuarioCreateInput = {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  equipeId: string;
};

export type UsuarioEditInput = {
  id: string;
  nome: string;
  email: string;
  equipeId: string;
};

export type UsuarioAlterarPerfilInput = {
  id: string;
  novoPerfil: PerfilUsuario;
};

export type UsuarioAlterarStatusInput = {
  id: string;
  status: StatusUsuario;
};