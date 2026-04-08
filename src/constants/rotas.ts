import type { LucideIcon } from "lucide-react";
import {
  FolderKanban,
  LayoutDashboard,
  Settings,
  SquareKanban,
  Wallet,
  Warehouse,
} from "lucide-react";

import { PERFIS_USUARIO } from "@/constants/perfis";

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

type ContextoPermissaoNavegacao = {
  perfilUsuario?: string | null;
  equipeNome?: string | null;
  temProjetosCoordenados?: boolean;
};

export type ItemNavegacaoPrincipal = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  podeExibir: (contexto: ContextoPermissaoNavegacao) => boolean;
};

function ehEquipeFinanceiro(equipeNome?: string | null) {
  return equipeNome?.trim().toLowerCase() === "financeiro";
}

function ehAdminOuCoordenador(perfilUsuario?: string | null) {
  return (
    perfilUsuario === PERFIS_USUARIO.ADMIN_SUPREMO ||
    perfilUsuario === PERFIS_USUARIO.COORDENADOR_GERAL
  );
}

function podeVerProjetos({
  perfilUsuario,
  temProjetosCoordenados,
}: ContextoPermissaoNavegacao) {
  return (
    ehAdminOuCoordenador(perfilUsuario) ||
    perfilUsuario === PERFIS_USUARIO.GESTOR_FINANCEIRO ||
    Boolean(temProjetosCoordenados)
  );
}

function podeVerFinanceiro({
  perfilUsuario,
  equipeNome,
}: ContextoPermissaoNavegacao) {
  return (
    ehAdminOuCoordenador(perfilUsuario) ||
    perfilUsuario === PERFIS_USUARIO.GESTOR_FINANCEIRO ||
    ehEquipeFinanceiro(equipeNome)
  );
}

export const NAVEGACAO_PRINCIPAL: ItemNavegacaoPrincipal[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: ROTAS_APP.dashboard,
    icon: LayoutDashboard,
    podeExibir: () => true,
  },
  {
    key: "tarefas",
    label: "Tarefas",
    href: ROTAS_APP.tarefas,
    icon: SquareKanban,
    podeExibir: ({ perfilUsuario }) =>
      perfilUsuario !== PERFIS_USUARIO.ANALISTA_FINANCEIRO,
  },
  {
    key: "projetos",
    label: "Projetos",
    href: ROTAS_APP.projetos,
    icon: FolderKanban,
    podeExibir: podeVerProjetos,
  },
  {
    key: "financeiro",
    label: "Financeiro",
    href: ROTAS_APP.financeiro,
    icon: Wallet,
    podeExibir: podeVerFinanceiro,
  },
  {
    key: "espacos",
    label: "Espaços",
    href: ROTAS_APP.espacos,
    icon: Warehouse,
    podeExibir: ({ perfilUsuario }) =>
      perfilUsuario !== PERFIS_USUARIO.ANALISTA_FINANCEIRO,
  },
  {
    key: "configuracoes",
    label: "Configurações",
    href: ROTAS_APP.configuracoes,
    icon: Settings,
    podeExibir: ({ perfilUsuario }) => ehAdminOuCoordenador(perfilUsuario),
  },
];