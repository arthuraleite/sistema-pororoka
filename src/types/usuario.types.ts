export type UsuarioSistema = {
  id: string;
  email: string;
  nome: string;
  perfil:
    | "admin_supremo"
    | "coordenador_geral"
    | "gestor_financeiro"
    | "coordenador_equipe"
    | "assistente"
    | "membro"
    | "analista_financeiro";
  equipeId: string | null;
  avatarUrl: string | null;
  status: "ativo" | "inativo";
  ultimoLoginEm: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
};