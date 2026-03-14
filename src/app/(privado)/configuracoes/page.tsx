import { redirect } from "next/navigation";

import { ConfiguracoesHome } from "@/components/configuracoes/configuracoes-home";
import { ROTAS_APP } from "@/constants/rotas";

export default function ConfiguracoesPage() {
  redirect(ROTAS_APP.configuracoesUsuarios);

  return (
    <ConfiguracoesHome
      title="Configurações"
      description="Área administrativa institucional do sistema."
    />
  );
}