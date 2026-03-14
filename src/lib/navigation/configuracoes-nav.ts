import { ROTAS_APP } from "@/constants/rotas";
import type { ConfiguracoesSubarea } from "@/types/configuracoes/configuracoes.types";

export type ConfiguracoesNavItem = {
  key: ConfiguracoesSubarea;
  label: string;
  href: string;
  description: string;
};

export const CONFIGURACOES_NAV: ConfiguracoesNavItem[] = [
  {
    key: "usuarios",
    label: "Usuários",
    href: ROTAS_APP.configuracoesUsuarios,
    description: "Gestão institucional de usuários, perfis e status.",
  },
  {
    key: "equipes",
    label: "Equipes",
    href: ROTAS_APP.configuracoesEquipes,
    description: "Gestão das equipes fixas do sistema.",
  },
];