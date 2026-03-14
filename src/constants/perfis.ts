export const PERFIS_USUARIO = {
  ADMIN_SUPREMO: "admin_supremo",
  COORDENADOR_GERAL: "coordenador_geral",
  GESTOR_FINANCEIRO: "gestor_financeiro",
  COORDENADOR_EQUIPE: "coordenador_equipe",
  ASSISTENTE: "assistente",
  MEMBRO: "membro",
  ANALISTA_FINANCEIRO: "analista_financeiro",
} as const;

export type PerfilUsuario =
  (typeof PERFIS_USUARIO)[keyof typeof PERFIS_USUARIO];