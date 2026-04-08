export const TIPOS_PROJETO = ["financiado", "interno"] as const;

export const STATUS_PROJETO = [
  "a_iniciar",
  "em_andamento",
  "finalizado",
  "concluido",
] as const;

export type UUID = string;

export type TipoProjeto = (typeof TIPOS_PROJETO)[number];
export type StatusProjeto = (typeof STATUS_PROJETO)[number];

export type ResultadoOperacaoProjeto<T = void> = {
  sucesso: boolean;
  mensagem: string;
  data?: T;
};

export type ProjetosPaginados<T> = {
  itens: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type ProjetoLinkItem = {
  id: UUID;
  titulo: string;
  url: string;
  ordem: number;
};

export type RubricaProjetoItem = {
  id: UUID;
  rubrica_global_id: UUID;
  rubrica_nome: string;
  limite_teto_gasto: number;
  ativa: boolean;
};

export type ObjetivoProjetoResumo = {
  id: UUID;
  titulo: string;
  status: string;
  data_entrega: string;
  hora_entrega: string | null;
};

export type ProjetoListItem = {
  id: UUID;
  tipo: TipoProjeto;
  nome: string;
  sigla: string;
  resumo: string | null;
  financiador_id: UUID | null;
  financiador_nome: string | null;
  data_inicio: string;
  data_fim: string | null;
  orcamento_total: number | null;
  status: StatusProjeto;
  coordenador_id: UUID;
  coordenador_nome: string | null;
  observacoes: string | null;
  total_objetivos: number;
  total_objetivos_concluidos: number;
  data_criacao: string;
  data_atualizacao: string;
};

export type ProjetoDetalhe = {
  id: UUID;
  tipo: TipoProjeto;
  nome: string;
  sigla: string;
  resumo: string | null;
  financiador_id: UUID | null;
  financiador_nome: string | null;
  data_inicio: string;
  data_fim: string | null;
  orcamento_total: number | null;
  status: StatusProjeto;
  coordenador_id: UUID;
  coordenador_nome: string | null;
  observacoes: string | null;
  links: ProjetoLinkItem[];
  rubricas: RubricaProjetoItem[];
  objetivos: ObjetivoProjetoResumo[];
  data_criacao: string;
  data_atualizacao: string;
};

export type ProjetoRubricaFormItem = {
  rubrica_global_id: UUID;
  limite_teto_gasto: number | null;
};

export type ProjetoLinkFormItem = {
  titulo: string;
  url: string;
};

export type ProjetoFormData = {
  tipo: TipoProjeto;
  nome: string;
  sigla: string;
  resumo: string | null;
  coordenador_id: UUID;
  data_inicio: string;
  data_fim: string | null;
  financiador_id: UUID | null;
  orcamento_total: number | null;
  status: StatusProjeto;
  observacoes: string | null;
  links: ProjetoLinkFormItem[];
  rubricas: ProjetoRubricaFormItem[];
};

export type ProjetosDashboardResumo = {
  total_projetos: number;
  valor_total_orcamento: number;
  projetos_concluidos: number;
  projetos_em_execucao: number;
};

export type ProjetosFiltros = {
  busca?: string;
  tipo?: TipoProjeto[];
  status?: StatusProjeto[];
  coordenadorIds?: string[];
  financiadorIds?: string[];
  ordenacao?: "nome" | "data_inicio" | "orcamento_total" | "status";
};

export type UsuarioCoordenadorProjetoOption = {
  id: UUID;
  nome: string;
  perfil: string;
};

export type FinanciadorProjetoOption = {
  id: UUID;
  nome: string;
};

export type RubricaGlobalProjetoOption = {
  id: UUID;
  nome: string;
  descricao: string | null;
};

export type OpcoesProjetos = {
  coordenadores: UsuarioCoordenadorProjetoOption[];
  financiadores: FinanciadorProjetoOption[];
  rubricasGlobais: RubricaGlobalProjetoOption[];
};

export type UsuarioAtualProjetos = {
  id: UUID;
  perfil: string;
  status: string;
};

export type ProjetoModalModo = "create" | "view" | "edit";