export const ROTAS_APP = {
  dashboard: "/dashboard",
  usuarios: "/usuarios",
  equipes: "/equipes",
  tarefas: "/tarefas",
  projetos: "/projetos",
  financeiro: "/financeiro",
  espacos: "/espacos",
  configuracoes: "/configuracoes",
  configuracoesUsuarios: "/configuracoes/usuarios",
  configuracoesEquipes: "/configuracoes/equipes",
} as const;

export const NAVEGACAO_PRINCIPAL = [
  { label: "Dashboard", href: ROTAS_APP.dashboard },
  { label: "Tarefas", href: ROTAS_APP.tarefas },
  { label: "Projetos", href: ROTAS_APP.projetos },
  { label: "Financeiro", href: ROTAS_APP.financeiro },
  { label: "Espaços", href: ROTAS_APP.espacos },
  { label: "Configurações",href: ROTAS_APP.configuracoes },
];