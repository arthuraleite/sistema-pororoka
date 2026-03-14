import { ConfiguracoesHome } from "@/components/configuracoes/configuracoes-home";
import { EquipesPageClient } from "@/components/configuracoes/equipes/equipes-page-client";
import { listarEquipesAction } from "@/actions/configuracoes/equipes/listar-equipes";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";
import { podeExecutarAcaoConfiguracoes } from "@/lib/auth/configuracoes-permissions";

export default async function ConfiguracoesEquipesPage() {
  const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();
  const response = await listarEquipesAction();

  const equipes = response.sucesso ? response.dados : [];

  return (
    <ConfiguracoesHome
      title="Equipes"
      description="Gestão das equipes fixas do Sistema Pororoka."
    >
      <EquipesPageClient
        equipes={equipes}
        podeCadastrar={podeExecutarAcaoConfiguracoes(usuarioAtual, "cadastrar_equipe")}
        podeEditar={podeExecutarAcaoConfiguracoes(usuarioAtual, "editar_equipe")}
      />
    </ConfiguracoesHome>
  );
}