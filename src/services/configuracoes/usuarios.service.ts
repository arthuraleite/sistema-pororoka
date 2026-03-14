import { UsuariosRepository } from "@/repositories/configuracoes/usuarios.repository";
import { EquipesRepository } from "@/repositories/configuracoes/equipes.repository";
import { AuditoriaRepository } from "@/repositories/configuracoes/auditoria.repository";
import { ProvisionamentoUsuarioAuthService } from "@/services/configuracoes/provisionamento-usuario-auth.service";
import { podeExecutarAcaoConfiguracoes } from "@/lib/auth/configuracoes-permissions";
import type { UsuarioAutorizadoConfiguracoes } from "@/types/configuracoes/configuracoes.types";
import type {
  UsuarioAlterarPerfilInput,
  UsuarioAlterarStatusInput,
  UsuarioCreateInput,
  UsuarioEditInput,
} from "@/types/configuracoes/usuarios.types";

export class UsuariosService {
  constructor(
    private readonly usuariosRepository = new UsuariosRepository(),
    private readonly equipesRepository = new EquipesRepository(),
    private readonly auditoriaRepository = new AuditoriaRepository(),
    private readonly provisionamentoAuthService = new ProvisionamentoUsuarioAuthService(),
  ) {}

  async listar(usuarioAtual: UsuarioAutorizadoConfiguracoes) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "listar_usuarios")) {
      throw new Error("Você não tem permissão para listar usuários.");
    }

    return this.usuariosRepository.listar();
  }

  async buscar(usuarioAtual: UsuarioAutorizadoConfiguracoes, id: string) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "ver_usuario")) {
      throw new Error("Você não tem permissão para visualizar usuários.");
    }

    return this.usuariosRepository.buscarPorId(id);
  }

  async cadastrar(usuarioAtual: UsuarioAutorizadoConfiguracoes, input: UsuarioCreateInput) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "cadastrar_usuario")) {
      throw new Error("Você não tem permissão para cadastrar usuários.");
    }

    const equipe = await this.equipesRepository.buscarPorId(input.equipeId);
    if (!equipe) {
      throw new Error("Equipe não encontrada.");
    }

    const emailExistente = await this.usuariosRepository.buscarPorEmail(input.email);
    if (emailExistente) {
      throw new Error("Já existe um usuário com esse e-mail.");
    }

    let authUser: { id: string; email: string } | null = null;

    try {
      authUser = await this.provisionamentoAuthService.criarConta({
        email: input.email,
        nome: input.nome,
      });

      const usuario = await this.usuariosRepository.criar({
        id: authUser.id,
        nome: input.nome,
        email: authUser.email,
        perfil: input.perfil,
        equipeId: input.equipeId,
      });

      await this.auditoriaRepository.registrar({
        atorId: usuarioAtual.id,
        acao: "usuario_criado",
        entidade: "usuarios",
        entidadeId: usuario.id,
        detalhes: {
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          equipeId: usuario.equipeId,
        },
      });

      return usuario;
    } catch (error) {
      if (authUser?.id) {
        try {
          await this.provisionamentoAuthService.removerConta(authUser.id);
        } catch (rollbackError) {
          throw new Error(
            `Falha ao criar usuário institucional e falha no rollback do Auth: ${
              rollbackError instanceof Error ? rollbackError.message : "erro desconhecido"
            }`,
          );
        }
      }

      throw error;
    }
  }

  async editar(usuarioAtual: UsuarioAutorizadoConfiguracoes, input: UsuarioEditInput) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "editar_usuario")) {
      throw new Error("Você não tem permissão para editar usuários.");
    }

    const atual = await this.usuariosRepository.buscarPorId(input.id);
    if (!atual) {
      throw new Error("Usuário não encontrado.");
    }

    const equipe = await this.equipesRepository.buscarPorId(input.equipeId);
    if (!equipe) {
      throw new Error("Equipe não encontrada.");
    }

    const emailExistente = await this.usuariosRepository.buscarPorEmail(input.email);
    if (emailExistente && emailExistente.id !== input.id) {
      throw new Error("Já existe outro usuário com esse e-mail.");
    }

    const emailMudou = atual.email !== input.email;
    let emailAnteriorAuth: string | null = null;
    let emailAuthAtualizado = false;

    try {
      if (emailMudou) {
        const contaAuthAtual = await this.provisionamentoAuthService.buscarConta(input.id);
        emailAnteriorAuth = contaAuthAtual.email;

        await this.provisionamentoAuthService.atualizarEmail({
          id: input.id,
          email: input.email,
        });

        emailAuthAtualizado = true;
      }

      const usuario = await this.usuariosRepository.editar({
        id: input.id,
        nome: input.nome,
        email: input.email,
        equipeId: input.equipeId,
      });

      await this.auditoriaRepository.registrar({
        atorId: usuarioAtual.id,
        acao: "usuario_editado",
        entidade: "usuarios",
        entidadeId: usuario.id,
        detalhes: {
          antes: {
            nome: atual.nome,
            email: atual.email,
            equipeId: atual.equipeId,
          },
          depois: {
            nome: usuario.nome,
            email: usuario.email,
            equipeId: usuario.equipeId,
          },
        },
      });

      return usuario;
    } catch (error) {
      if (emailMudou && emailAuthAtualizado && emailAnteriorAuth) {
        try {
          await this.provisionamentoAuthService.atualizarEmail({
            id: input.id,
            email: emailAnteriorAuth,
          });
        } catch (rollbackError) {
          throw new Error(
            `Falha ao editar usuário e falha no rollback do e-mail no Auth: ${
              rollbackError instanceof Error ? rollbackError.message : "erro desconhecido"
            }`,
          );
        }
      }

      throw error;
    }
  }

  async alterarPerfil(
    usuarioAtual: UsuarioAutorizadoConfiguracoes,
    input: UsuarioAlterarPerfilInput,
  ) {
    if (
      !podeExecutarAcaoConfiguracoes(usuarioAtual, "alterar_perfil_usuario", input.id)
    ) {
      throw new Error("Você não tem permissão para alterar o perfil deste usuário.");
    }

    const atual = await this.usuariosRepository.buscarPorId(input.id);
    if (!atual) {
      throw new Error("Usuário não encontrado.");
    }

    const usuario = await this.usuariosRepository.alterarPerfil({
      id: input.id,
      perfil: input.novoPerfil,
    });

    await this.auditoriaRepository.registrar({
      atorId: usuarioAtual.id,
      acao: "usuario_perfil_alterado",
      entidade: "usuarios",
      entidadeId: usuario.id,
      detalhes: {
        antes: atual.perfil,
        depois: usuario.perfil,
      },
    });

    return usuario;
  }

  async alterarStatus(
    usuarioAtual: UsuarioAutorizadoConfiguracoes,
    input: UsuarioAlterarStatusInput,
  ) {
    const acao = input.status === "inativo" ? "inativar_usuario" : "reativar_usuario";

    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, acao, input.id)) {
      throw new Error("Você não tem permissão para alterar o status deste usuário.");
    }

    const atual = await this.usuariosRepository.buscarPorId(input.id);
    if (!atual) {
      throw new Error("Usuário não encontrado.");
    }

    const usuario = await this.usuariosRepository.alterarStatus({
      id: input.id,
      status: input.status,
    });

    await this.auditoriaRepository.registrar({
      atorId: usuarioAtual.id,
      acao: input.status === "inativo" ? "usuario_inativado" : "usuario_reativado",
      entidade: "usuarios",
      entidadeId: usuario.id,
      detalhes: {
        antes: atual.status,
        depois: usuario.status,
      },
    });

    return usuario;
  }
}