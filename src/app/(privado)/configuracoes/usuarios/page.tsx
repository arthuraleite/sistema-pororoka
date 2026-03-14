import { ConfiguracoesHome } from "@/components/configuracoes/configuracoes-home";
import { UsuariosPageClient } from "@/components/configuracoes/usuarios/usuarios-page-client";
import { listarUsuariosAction } from "@/actions/configuracoes/usuarios/listar-usuarios";
import { listarEquipesAction } from "@/actions/configuracoes/equipes/listar-equipes";
import { obterUsuarioAutorizadoConfiguracoes } from "@/actions/configuracoes/shared/obter-usuario-autorizado-configuracoes";
import { podeExecutarAcaoConfiguracoes } from "@/lib/auth/configuracoes-permissions";

export default async function ConfiguracoesUsuariosPage() {
  const usuarioAtual = await obterUsuarioAutorizadoConfiguracoes();

  const [usuariosResponse, equipesResponse] = await Promise.all([
    listarUsuariosAction(),
    listarEquipesAction(),
  ]);

  const usuarios = usuariosResponse.sucesso ? usuariosResponse.dados : [];
  const equipes = equipesResponse.sucesso ? equipesResponse.dados : [];

  return (
    <ConfiguracoesHome
      title="Usuários"
      description="Gestão institucional de usuários, perfis, equipe e status."
    >
      <UsuariosPageClient
        usuarios={usuarios}
        equipes={equipes}
        podeCadastrar={podeExecutarAcaoConfiguracoes(
          usuarioAtual,
          "cadastrar_usuario",
        )}
        podeEditar={podeExecutarAcaoConfiguracoes(
          usuarioAtual,
          "editar_usuario",
        )}
        podeAlterarPerfil={podeExecutarAcaoConfiguracoes(
          usuarioAtual,
          "alterar_perfil_usuario",
        )}
        podeInativar={podeExecutarAcaoConfiguracoes(
          usuarioAtual,
          "inativar_usuario",
        )}
        podeReativar={podeExecutarAcaoConfiguracoes(
          usuarioAtual,
          "reativar_usuario",
        )}
      />
    </ConfiguracoesHome>
  );
}