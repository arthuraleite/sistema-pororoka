export const TIPOS_TAREFA = ["pai", "filha", "orfa"] as const;

export const STATUS_TAREFA = [
  "a_fazer",
  "em_andamento",
  "atencao",
  "em_atraso",
  "em_pausa",
  "concluida",
] as const;

export const PRIORIDADES_TAREFA = [
  "urgente",
  "alta",
  "media",
  "baixa",
] as const;

export const TIPOS_EVENTO_RESPONSAVEL_TAREFA = [
  "adicionado",
  "removido",
  "reatribuido",
] as const;

export const TIPOS_NOTIFICACAO_TAREFA = [
  "nova_tarefa_atribuida",
  "responsavel_alterado_para_mim",
  "comentario_em_tarefa_acompanhada",
  "resposta_ao_meu_comentario",
  "tarefa_perto_do_prazo",
  "tarefa_em_atraso",
  "tarefa_reaberta",
] as const;

export const ALERTAS_PRAZO_TAREFA = [1, 3, 7] as const;

export type UUID = string;

export type TipoTarefa = (typeof TIPOS_TAREFA)[number];

export type StatusTarefa = (typeof STATUS_TAREFA)[number];

export type PrioridadeTarefa = (typeof PRIORIDADES_TAREFA)[number];

export type EscopoObjetivo = "global" | "equipe";

export type PerfilSistema =
  | "admin_supremo"
  | "coordenador_geral"
  | "gestor_financeiro"
  | "coordenador_equipe"
  | "assistente"
  | "membro"
  | "analista_financeiro";

export type StatusUsuarioSistema = "ativo" | "inativo";

export type TipoNotificacaoTarefa =
  (typeof TIPOS_NOTIFICACAO_TAREFA)[number];

export type AlertaPrazoTarefa = (typeof ALERTAS_PRAZO_TAREFA)[number];

export type TarefaNotificacao = {
  id: UUID;
  usuarioId: UUID;
  tarefaId: UUID;
  comentarioId: UUID | null;
  tipo: TipoNotificacaoTarefa;
  titulo: string;
  descricao: string | null;
  lida: boolean;
  dataCriacao: string;
  dataExpiracao: string | null;
};

export type ResultadoOperacaoTarefa<T = void> = {
  sucesso: boolean;
  mensagem: string;
  data?: T;
};

export type TarefasPaginadas<T> = {
  itens: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type EquipeResumoTarefa = {
  id: UUID;
  nome: string;
  cor: string | null;
};

export type CategoriaTarefa = {
  id: UUID;
  nome: string;
  equipeId: UUID;
  descricao?: string | null;
  ativo: boolean;
  criadoPorId?: UUID;
  atualizadoPorId?: UUID | null;
  dataCriacao?: string;
  dataAtualizacao?: string;
};

export type UsuarioResumoTarefa = {
  id: UUID;
  nome: string;
  email: string;
  avatarUrl: string | null;
  perfil: PerfilSistema;
  status: StatusUsuarioSistema;
  equipeId: UUID | null;
  equipeNome: string | null;
};

export type TarefaResponsavelResumo = {
  id: UUID;
  nome: string;
  avatarUrl: string | null;
};

export type TarefaResponsavel = {
  id: UUID;
  tarefaId: UUID;
  usuarioId: UUID;
  atribuidoPorId: UUID;
  dataCriacao: string;
};

export type TarefaResponsavelHistoricoEvento =
  (typeof TIPOS_EVENTO_RESPONSAVEL_TAREFA)[number];

export type TarefaResponsavelHistorico = {
  id: UUID;
  tarefaId: UUID;
  usuarioAfetadoId: UUID;
  alteradoPorId: UUID;
  tipoEvento: TarefaResponsavelHistoricoEvento;
  dataEvento: string;
};

export type TarefaLink = {
  id: UUID;
  tarefaId: UUID;
  url: string;
  texto: string | null;
  criadoPorId: UUID;
  dataCriacao: string;
  dataAtualizacao: string | null;
};

export type TarefaComentario = {
  id: UUID;
  tarefaId: UUID;
  comentarioPaiId: UUID | null;
  autorId: UUID;
  autorNome: string;
  autorAvatarUrl: string | null;
  conteudo: string;
  linkExterno: string | null;
  editado: boolean;
  dataCriacao: string;
  dataAtualizacao: string | null;
  respostas: TarefaComentario[];
};

export type TarefaChecklistItem = {
  id: UUID;
  titulo: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa | null;
  dataEntrega: string;
  horaEntrega: string | null;
};

export type TarefaFilhaResumo = {
  id: UUID;
  titulo: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa | null;
  dataEntrega: string;
  horaEntrega: string | null;
};

type TarefaBase = {
  id: UUID;
  tipo: TipoTarefa;
  titulo: string;
  descricao: string | null;
  projetoId: UUID | null;
  prioridade: PrioridadeTarefa | null;
  status: StatusTarefa;
  dataEntrega: string;
  horaEntrega: string | null;
  dataConclusao: string | null;
  criadoPorId: UUID;
  atualizadoPorId: UUID | null;
  dataCriacao: string;
  dataAtualizacao: string;
  responsaveis?: TarefaResponsavelResumo[];
};

export type TarefaPai = TarefaBase & {
  tipo: "pai";
  escopoObjetivo: EscopoObjetivo;
  tarefaPaiId: null;
  equipeId: UUID | null;
  equipe: EquipeResumoTarefa | null;
  categoriaId: null;
  categoria: null;
  filhas?: TarefaChecklistItem[];
};

export type TarefaFilha = TarefaBase & {
  tipo: "filha";
  escopoObjetivo: null;
  tarefaPaiId: UUID;
  equipeId: UUID;
  equipe: EquipeResumoTarefa | null;
  categoriaId: UUID;
  categoria: CategoriaTarefa | null;
};

export type TarefaOrfa = TarefaBase & {
  tipo: "orfa";
  escopoObjetivo: null;
  tarefaPaiId: null;
  equipeId: UUID;
  equipe: EquipeResumoTarefa | null;
  categoriaId: UUID;
  categoria: CategoriaTarefa | null;
};

export type Tarefa = TarefaPai | TarefaFilha | TarefaOrfa;

type TarefaDetalheBase = {
  id: UUID;
  tipo: TipoTarefa;
  titulo: string;
  descricao: string | null;
  projetoId: UUID | null;
  prioridade: PrioridadeTarefa | null;
  status: StatusTarefa;
  dataEntrega: string;
  horaEntrega: string | null;
  dataConclusao: string | null;
  criadoPorId: UUID;
  atualizadoPorId: UUID | null;
  dataCriacao: string;
  dataAtualizacao: string;
  responsaveis: UsuarioResumoTarefa[];
  links: TarefaLink[];
  comentarios: TarefaComentario[];
};

export type TarefaPaiDetalhe = TarefaDetalheBase & {
  tipo: "pai";
  escopoObjetivo: EscopoObjetivo;
  tarefaPaiId: null;
  tarefaPai?: undefined;
  equipeId: UUID | null;
  equipe: EquipeResumoTarefa | null;
  categoriaId: null;
  categoria: null;
  filhas: TarefaChecklistItem[];
};

export type TarefaFilhaDetalhe = TarefaDetalheBase & {
  tipo: "filha";
  escopoObjetivo: null;
  tarefaPaiId: UUID;
  tarefaPai?: {
    id: UUID;
    titulo: string;
  } | null;
  equipeId: UUID;
  equipe: EquipeResumoTarefa | null;
  categoriaId: UUID;
  categoria: CategoriaTarefa | null;
  filhas?: undefined;
};

export type TarefaOrfaDetalhe = TarefaDetalheBase & {
  tipo: "orfa";
  escopoObjetivo: null;
  tarefaPaiId: null;
  tarefaPai?: null;
  equipeId: UUID;
  equipe: EquipeResumoTarefa | null;
  categoriaId: UUID;
  categoria: CategoriaTarefa | null;
  filhas?: undefined;
};

export type TarefaDetalhe =
  | TarefaPaiDetalhe
  | TarefaFilhaDetalhe
  | TarefaOrfaDetalhe;

export type TarefasFiltros = {
  busca?: string;
  status?: StatusTarefa[];
  prioridades?: PrioridadeTarefa[];
  categoriaIds?: string[];
  equipeIds?: string[];
  responsavelIds?: string[];
  tipo?: "todas" | "pai" | "filha" | "orfa";
  ordenacao?: "alfabetica" | "prioridade" | "status" | "data_entrega";
  dataInicio?: string;
  dataFim?: string;
  ocultarConcluidas?: boolean;
  apenasAtrasadas?: boolean;
  apenasMacros?: boolean;
  apenasOperacionais?: boolean;
};

export type OrdenacaoTarefa = {
  coluna:
    | "titulo"
    | "status"
    | "prioridade"
    | "data_entrega"
    | "data_criacao";
  direcao: "asc" | "desc";
};

export type TarefaCardResponsavel = {
  id: UUID;
  nome: string;
  avatarUrl: string | null;
};

export type TarefaCardEquipe = {
  id: UUID;
  nome: string;
  cor: string | null;
} | null;

export type TarefaCardCategoria = {
  id: UUID;
  nome: string;
} | null;

export type TarefaKanbanCard = {
  id: UUID;
  tipo: TipoTarefa;
  titulo: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa | null;
  categoria: TarefaCardCategoria;
  equipe: TarefaCardEquipe;
  prazo: string;
  horaEntrega: string | null;
  responsaveis: TarefaCardResponsavel[];
  emAtraso: boolean;
};

export type TarefaCalendarioItem = {
  id: UUID;
  titulo: string;
  dataEntrega: string;
  horaEntrega: string | null;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa | null;
  equipe: TarefaCardEquipe;
  categoria: TarefaCardCategoria;
  responsaveis: TarefaCardResponsavel[];
  emAtraso: boolean;
};

export type TarefaCalendarioDia = {
  data: string;
  itens: TarefaCalendarioItem[];
};

export type TarefaDashboardCard = {
  id: UUID;
  titulo: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa | null;
  prazo: string;
  horaEntrega: string | null;
  categoria: TarefaCardCategoria;
  equipe: TarefaCardEquipe;
  responsaveis: TarefaCardResponsavel[];
  emAtraso: boolean;
};

export type TarefaDashboardSemanaDia = {
  diaSemana: string;
  data: string;
  tarefas: TarefaDashboardCard[];
};

export type TarefaDashboardSemana = {
  atrasadas: TarefaDashboardCard[];
  dias: TarefaDashboardSemanaDia[];
};

export type TarefaDashboardAFazer = {
  itens: TarefaDashboardCard[];
};

export type TarefaDashboardMacro = {
  id: UUID;
  titulo: string;
  escopoObjetivo: EscopoObjetivo;
  equipeId: UUID | null;
  equipe: EquipeResumoTarefa | null;
  percentualConclusao: number;
  totalFilhas: number;
  totalFilhasConcluidas: number;
  filhas: TarefaChecklistItem[];
};

export type TarefaDashboardAcompanhamentoMacros = {
  itens: TarefaDashboardMacro[];
};

export type TarefaDashboardData = {
  minhasTarefasSemana: TarefaDashboardSemana;
  minhasTarefasAFazer: TarefaDashboardAFazer;
  acompanhamentoMacros?: TarefaDashboardAcompanhamentoMacros | null;
};

export type CriarTarefaPaiInput = {
  tipo: "pai";
  escopoObjetivo: EscopoObjetivo;
  equipeId?: UUID | null;
  titulo: string;
  descricao?: string | null;
  projetoId?: UUID | null;
  prioridade?: PrioridadeTarefa | null;
  status?: StatusTarefa;
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: UUID[];
  links: Array<{
    id?: UUID;
    url: string;
    texto?: string | null;
  }>;
};

export type CriarTarefaOperacionalInput = {
  tipo: "filha" | "orfa";
  escopoObjetivo: null;
  titulo: string;
  descricao?: string | null;
  tarefaPaiId?: UUID | null;
  equipeId?: UUID | null;
  categoriaId?: UUID | null;
  prioridade?: PrioridadeTarefa | null;
  status?: StatusTarefa;
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: UUID[];
  links: Array<{
    id?: UUID;
    url: string;
    texto?: string | null;
  }>;
};

export type CriarTarefaInput =
  | CriarTarefaPaiInput
  | CriarTarefaOperacionalInput;

export type EditarTarefaPaiInput = {
  id: UUID;
  tipo: "pai";
  escopoObjetivo: EscopoObjetivo;
  equipeId?: UUID | null;
  titulo: string;
  descricao?: string | null;
  projetoId?: UUID | null;
  prioridade?: PrioridadeTarefa | null;
  status?: StatusTarefa;
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: UUID[];
  links: Array<{
    id?: UUID;
    url: string;
    texto?: string | null;
  }>;
};

export type EditarTarefaOperacionalInput = {
  id: UUID;
  tipo: "filha" | "orfa";
  escopoObjetivo: null;
  titulo: string;
  descricao?: string | null;
  tarefaPaiId?: UUID | null;
  equipeId?: UUID | null;
  categoriaId?: UUID | null;
  prioridade?: PrioridadeTarefa | null;
  status?: StatusTarefa;
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: UUID[];
  links: Array<{
    id?: UUID;
    url: string;
    texto?: string | null;
  }>;
};

export type EditarTarefaInput =
  | EditarTarefaPaiInput
  | EditarTarefaOperacionalInput;

export type MoverTarefaStatusInput = {
  id: UUID;
  novoStatus: StatusTarefa;
};

export type ReabrirTarefaInput = {
  id: UUID;
  novoStatus: Exclude<StatusTarefa, "concluida" | "em_atraso">;
};

export type ExcluirTarefaInput = {
  id: UUID;
};

export type GerirResponsaveisInput = {
  tarefaId: UUID;
  responsavelIds: UUID[];
};

export type AdicionarComentarioInput = {
  tarefaId: UUID;
  comentarioPaiId?: UUID | null;
  conteudo: string;
  linkExterno?: string | null;
};

export type EditarComentarioInput = {
  comentarioId: UUID;
  conteudo: string;
  linkExterno?: string | null;
};

export type ExcluirComentarioInput = {
  comentarioId: UUID;
};

export type CriarCategoriaTarefaInput = {
  nome: string;
  equipeId: UUID;
  descricao?: string | null;
};

export type EditarCategoriaTarefaInput = {
  id: UUID;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
};

export type DesativarCategoriaTarefaInput = {
  id: UUID;
};

export type ConfigAlertaPrazoUsuario = {
  diasAntecedencia: AlertaPrazoTarefa;
};