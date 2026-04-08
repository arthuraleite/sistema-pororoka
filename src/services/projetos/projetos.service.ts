import { projetoSchema } from "@/schemas/projetos/projeto.schema";
import {
  buscarProjetoPorId,
  buscarResumoDashboardProjetos,
  contarProjetosCoordenadosPorUsuario,
  criarFinanciadorProjeto,
  criarProjetoRepository,
  criarRubricaGlobalProjeto,
  editarProjetoRepository,
  listarCoordenadoresProjeto,
  listarFinanciadoresProjeto,
  listarProjetosVisiveis,
  listarRubricasGlobaisProjeto,
} from "@/repositories/projetos/projetos.repository";
import { buscarUsuarioPorId } from "@/repositories/usuarios/buscarUsuarioPorId";
import {
  podeAcessarModuloProjetos,
  podeAdministrarProjetos,
} from "@/lib/auth/projetos-permissions";
import type {
  ProjetoFormData,
  ProjetoListItem,
  ProjetosDashboardResumo,
  ProjetosFiltros,
} from "@/types/projetos/projetos.types";

type UsuarioProjetos = {
  id: string;
  perfil: string;
  status: string;
};

function aplicarFiltrosProjetos(
  projetos: ProjetoListItem[],
  filtros?: ProjetosFiltros,
) {
  if (!filtros) return projetos;

  const busca = filtros.busca?.trim().toLowerCase() ?? "";
  const tipos = filtros.tipo ?? [];
  const status = filtros.status ?? [];
  const coordenadorIds = filtros.coordenadorIds ?? [];
  const financiadorIds = filtros.financiadorIds ?? [];
  const ordenacao = filtros.ordenacao ?? "data_inicio";

  const filtrados = projetos.filter((item) => {
    if (busca) {
      const alvo = [
        item.nome,
        item.sigla,
        item.resumo ?? "",
        item.coordenador_nome ?? "",
        item.financiador_nome ?? "",
      ]
        .join(" ")
        .toLowerCase();

      if (!alvo.includes(busca)) return false;
    }

    if (tipos.length > 0 && !tipos.includes(item.tipo)) return false;
    if (status.length > 0 && !status.includes(item.status)) return false;

    if (
      coordenadorIds.length > 0 &&
      !coordenadorIds.includes(item.coordenador_id)
    ) {
      return false;
    }

    if (
      financiadorIds.length > 0 &&
      (!item.financiador_id || !financiadorIds.includes(item.financiador_id))
    ) {
      return false;
    }

    return true;
  });

  return [...filtrados].sort((a, b) => {
    switch (ordenacao) {
      case "nome":
        return a.nome.localeCompare(b.nome);
      case "orcamento_total":
        return (b.orcamento_total ?? 0) - (a.orcamento_total ?? 0);
      case "status":
        return a.status.localeCompare(b.status);
      case "data_inicio":
      default:
        return (
          new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
        );
    }
  });
}

async function buscarUsuarioProjetos(usuarioId: string) {
  return (await buscarUsuarioPorId(usuarioId)) as UsuarioProjetos | null;
}

function garantirAcessoModulo(usuario: UsuarioProjetos | null) {
  if (!podeAcessarModuloProjetos(usuario)) {
    throw new Error("Você não tem permissão para acessar o módulo de projetos.");
  }
}

function garantirAdministracaoProjetos(usuario: UsuarioProjetos | null) {
  if (!podeAdministrarProjetos(usuario)) {
    throw new Error("Você não tem permissão para alterar projetos.");
  }
}

export async function usuarioTemProjetosCoordenados(usuarioId: string) {
  const total = await contarProjetosCoordenadosPorUsuario(usuarioId);
  return total > 0;
}

export async function listarProjetosParaPagina(
  usuarioId: string,
  filtros?: ProjetosFiltros,
) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAcessoModulo(usuario);

  const projetos = await listarProjetosVisiveis();
  return aplicarFiltrosProjetos(projetos, filtros);
}

export async function buscarResumoProjetosParaDashboard(usuarioId: string) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAcessoModulo(usuario);

  const resumo: ProjetosDashboardResumo = await buscarResumoDashboardProjetos();
  return resumo;
}

export async function buscarProjetoDetalhado(usuarioId: string, projetoId: string) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAcessoModulo(usuario);

  return await buscarProjetoPorId(projetoId);
}

export async function listarCoordenadoresProjetoService(usuarioId: string) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAcessoModulo(usuario);

  return await listarCoordenadoresProjeto();
}

export async function listarFinanciadoresProjetoService(usuarioId: string) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAcessoModulo(usuario);

  return await listarFinanciadoresProjeto();
}

export async function criarFinanciadorProjetoService(
  usuarioId: string,
  nome: string,
) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAdministracaoProjetos(usuario);

  if (!nome.trim()) {
    throw new Error("Informe o nome do financiador.");
  }

  return await criarFinanciadorProjeto(nome);
}

export async function listarRubricasGlobaisProjetoService(usuarioId: string) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAcessoModulo(usuario);

  return await listarRubricasGlobaisProjeto();
}

export async function criarRubricaGlobalProjetoService(
  usuarioId: string,
  nome: string,
) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAdministracaoProjetos(usuario);

  if (!nome.trim()) {
    throw new Error("Informe o nome da rubrica.");
  }

  return await criarRubricaGlobalProjeto(nome);
}

export async function criarProjetoService(
  usuarioId: string,
  values: ProjetoFormData,
) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAdministracaoProjetos(usuario);

  const validacao = projetoSchema.safeParse(values);

  if (!validacao.success) {
    const primeiraMensagem =
      validacao.error.issues[0]?.message ?? "Dados inválidos para criar o projeto.";
    throw new Error(primeiraMensagem);
  }

  return await criarProjetoRepository(validacao.data);
}

export async function editarProjetoService(
  usuarioId: string,
  projetoId: string,
  values: ProjetoFormData,
) {
  const usuario = await buscarUsuarioProjetos(usuarioId);

  garantirAdministracaoProjetos(usuario);

  const validacao = projetoSchema.safeParse(values);

  if (!validacao.success) {
    const primeiraMensagem =
      validacao.error.issues[0]?.message ?? "Dados inválidos para editar o projeto.";
    throw new Error(primeiraMensagem);
  }

  return await editarProjetoRepository(projetoId, validacao.data);
}