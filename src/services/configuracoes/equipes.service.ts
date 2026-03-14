import { EquipesRepository } from "@/repositories/configuracoes/equipes.repository";
import { AuditoriaRepository } from "@/repositories/configuracoes/auditoria.repository";
import { podeExecutarAcaoConfiguracoes } from "@/lib/auth/configuracoes-permissions";
import type { UsuarioAutorizadoConfiguracoes } from "@/types/configuracoes/configuracoes.types";
import type {
  EquipeCreateInput,
  EquipeEditInput,
} from "@/types/configuracoes/equipes.types";

export class EquipesService {
  constructor(
    private readonly equipesRepository = new EquipesRepository(),
    private readonly auditoriaRepository = new AuditoriaRepository(),
  ) {}

  async listar(usuarioAtual: UsuarioAutorizadoConfiguracoes) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "listar_equipes")) {
      throw new Error("Você não tem permissão para listar equipes.");
    }

    return this.equipesRepository.listar();
  }

  async buscar(usuarioAtual: UsuarioAutorizadoConfiguracoes, id: string) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "ver_equipe")) {
      throw new Error("Você não tem permissão para visualizar equipes.");
    }

    return this.equipesRepository.buscarPorId(id);
  }

  async criar(
    usuarioAtual: UsuarioAutorizadoConfiguracoes,
    input: EquipeCreateInput,
  ) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "cadastrar_equipe")) {
      throw new Error("Você não tem permissão para criar equipes.");
    }

    const existente = await this.equipesRepository.buscarPorNome(input.nome);

    if (existente) {
      throw new Error("Já existe uma equipe com esse nome.");
    }

    const equipe = await this.equipesRepository.criar(input);

    await this.auditoriaRepository.registrar({
      atorId: usuarioAtual.id,
      acao: "equipe_criada",
      entidade: "equipes",
      entidadeId: equipe.id,
      detalhes: {
        nome: equipe.nome,
        descricao: equipe.descricao,
      },
    });

    return equipe;
  }

  async editar(
    usuarioAtual: UsuarioAutorizadoConfiguracoes,
    input: EquipeEditInput,
  ) {
    if (!podeExecutarAcaoConfiguracoes(usuarioAtual, "editar_equipe")) {
      throw new Error("Você não tem permissão para editar equipes.");
    }

    const equipeAtual = await this.equipesRepository.buscarPorId(input.id);

    if (!equipeAtual) {
      throw new Error("Equipe não encontrada.");
    }

    const equipeComMesmoNome = await this.equipesRepository.buscarPorNome(
      input.nome,
    );

    if (equipeComMesmoNome && equipeComMesmoNome.id !== input.id) {
      throw new Error("Já existe outra equipe com esse nome.");
    }

    const equipeEditada = await this.equipesRepository.editar(input);

    await this.auditoriaRepository.registrar({
      atorId: usuarioAtual.id,
      acao: "equipe_editada",
      entidade: "equipes",
      entidadeId: equipeEditada.id,
      detalhes: {
        antes: {
          nome: equipeAtual.nome,
          descricao: equipeAtual.descricao,
        },
        depois: {
          nome: equipeEditada.nome,
          descricao: equipeEditada.descricao,
        },
      },
    });

    return equipeEditada;
  }
}