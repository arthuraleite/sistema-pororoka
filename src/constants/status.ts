export const STATUS_USUARIO = {
  ATIVO: "ativo",
  INATIVO: "inativo",
} as const;

export const STATUS_TAREFA = {
  A_FAZER: "a_fazer",
  EM_ANDAMENTO: "em_andamento",
  EM_ATRASO: "em_atraso",
  CONCLUIDO: "concluido",
} as const;

export const STATUS_TRANSACAO = {
  RASCUNHO: "rascunho",
  PENDENTE_APROVACAO: "pendente_aprovacao",
  APROVADO: "aprovado",
  PAGO: "pago",
  CANCELADO: "cancelado",
  ESTORNADO: "estornado",
} as const;