import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import type {
  FinanciadorProjetoOption,
  ProjetoDetalhe,
  ProjetoFormData,
  ProjetoListItem,
  ProjetosDashboardResumo,
  RubricaProjetoItem,
  UsuarioCoordenadorProjetoOption,
} from "@/types/projetos/projetos.types";

type ProjetoRow = {
  id: string;
  tipo: "financiado" | "interno";
  nome: string;
  sigla: string;
  resumo: string | null;
  financiador_id: string | null;
  data_inicio: string;
  data_fim: string | null;
  orcamento_total: number | null;
  status: "a_iniciar" | "em_andamento" | "finalizado" | "concluido";
  coordenador_id: string;
  observacoes: string | null;
  data_criacao: string;
  data_atualizacao: string;
  financiador: Array<{ nome: string }> | { nome: string } | null;
  coordenador: Array<{ nome: string }> | { nome: string } | null;
};

type ProjetoDetalheRow = ProjetoRow;

type ProjetoLinkRow = {
  id: string;
  titulo: string;
  url: string;
  ordem: number;
};

type RubricaProjetoRow = {
  id: string;
  rubrica_global_id: string;
  limite_teto_gasto: number;
  ativa: boolean;
  rubrica_global: Array<{ nome: string }> | { nome: string } | null;
};

type TarefaObjetivoCountRow = {
  projeto_id: string | null;
  status: string;
};

type ObjetivoResumoRow = {
  id: string;
  titulo: string;
  status: string;
  data_entrega: string;
  hora_entrega: string | null;
};

function extrairNomeRelacionamento(
  relacionamento: Array<{ nome: string }> | { nome: string } | null,
) {
  if (!relacionamento) return null;
  if (Array.isArray(relacionamento)) return relacionamento[0]?.nome ?? null;
  return relacionamento.nome ?? null;
}

function mapProjetoRow(row: ProjetoRow, objetivos: TarefaObjetivoCountRow[]) {
  const objetivosDoProjeto = objetivos.filter(
    (item) => item.projeto_id === row.id,
  );

  const totalObjetivos = objetivosDoProjeto.length;
  const totalObjetivosConcluidos = objetivosDoProjeto.filter(
    (item) => item.status === "concluida",
  ).length;

  const item: ProjetoListItem = {
    id: row.id,
    tipo: row.tipo,
    nome: row.nome,
    sigla: row.sigla,
    resumo: row.resumo,
    financiador_id: row.financiador_id,
    financiador_nome: extrairNomeRelacionamento(row.financiador),
    data_inicio: row.data_inicio,
    data_fim: row.data_fim,
    orcamento_total: row.orcamento_total,
    status: row.status,
    coordenador_id: row.coordenador_id,
    coordenador_nome: extrairNomeRelacionamento(row.coordenador),
    observacoes: row.observacoes,
    total_objetivos: totalObjetivos,
    total_objetivos_concluidos: totalObjetivosConcluidos,
    data_criacao: row.data_criacao,
    data_atualizacao: row.data_atualizacao,
  };

  return item;
}

function mapRubricasDetalhe(rows: RubricaProjetoRow[]): RubricaProjetoItem[] {
  return rows.map((row) => ({
    id: row.id,
    rubrica_global_id: row.rubrica_global_id,
    rubrica_nome: extrairNomeRelacionamento(row.rubrica_global) ?? "Rubrica",
    limite_teto_gasto: row.limite_teto_gasto,
    ativa: row.ativa,
  }));
}

export async function contarProjetosCoordenadosPorUsuario(usuarioId: string) {
  const supabase = await criarClienteSupabaseServidor();

  const { count, error } = await supabase
    .from("projetos")
    .select("id", { count: "exact", head: true })
    .eq("coordenador_id", usuarioId);

  if (error) {
    throw new Error(
      `Erro ao contar projetos coordenados pelo usuário: ${error.message}`,
    );
  }

  return count ?? 0;
}

export async function listarProjetosVisiveis() {
  const supabase = await criarClienteSupabaseServidor();

  const [{ data: projetos, error: erroProjetos }, { data: objetivos, error: erroObjetivos }] =
    await Promise.all([
      supabase
        .from("projetos")
        .select(
          `
            id,
            tipo,
            nome,
            sigla,
            resumo,
            financiador_id,
            data_inicio,
            data_fim,
            orcamento_total,
            status,
            coordenador_id,
            observacoes,
            data_criacao,
            data_atualizacao,
            financiador:financiadores(nome),
            coordenador:usuarios!fk_projetos_coordenador(nome)
          `,
        )
        .order("data_inicio", { ascending: false }),
      supabase
        .from("tarefas")
        .select("projeto_id, status")
        .eq("tipo", "pai")
        .not("projeto_id", "is", null),
    ]);

  if (erroProjetos) {
    throw new Error(`Erro ao listar projetos: ${erroProjetos.message}`);
  }

  if (erroObjetivos) {
    throw new Error(`Erro ao listar objetivos dos projetos: ${erroObjetivos.message}`);
  }

  const projetosRows = (projetos ?? []) as unknown as ProjetoRow[];
  const objetivosRows = (objetivos ?? []) as TarefaObjetivoCountRow[];

  return projetosRows.map((row) => mapProjetoRow(row, objetivosRows));
}

export async function buscarResumoDashboardProjetos(): Promise<ProjetosDashboardResumo> {
  const projetos = await listarProjetosVisiveis();

  return {
    total_projetos: projetos.length,
    valor_total_orcamento: projetos.reduce(
      (acc, item) => acc + (item.orcamento_total ?? 0),
      0,
    ),
    projetos_concluidos: projetos.filter((item) => item.status === "concluido")
      .length,
    projetos_em_execucao: projetos.filter(
      (item) => item.status === "em_andamento",
    ).length,
  };
}

export async function buscarProjetoPorId(projetoId: string): Promise<ProjetoDetalhe | null> {
  const supabase = await criarClienteSupabaseServidor();

  const [{ data: projeto, error: erroProjeto }, { data: links, error: erroLinks }, { data: rubricas, error: erroRubricas }, { data: objetivos, error: erroObjetivos }] =
    await Promise.all([
      supabase
        .from("projetos")
        .select(
          `
            id,
            tipo,
            nome,
            sigla,
            resumo,
            financiador_id,
            data_inicio,
            data_fim,
            orcamento_total,
            status,
            coordenador_id,
            observacoes,
            data_criacao,
            data_atualizacao,
            financiador:financiadores(nome),
            coordenador:usuarios!fk_projetos_coordenador(nome)
          `,
        )
        .eq("id", projetoId)
        .maybeSingle(),
      supabase
        .from("projeto_links")
        .select("id, titulo, url, ordem")
        .eq("projeto_id", projetoId)
        .order("ordem", { ascending: true }),
      supabase
        .from("rubricas_projeto")
        .select(
          `
            id,
            rubrica_global_id,
            limite_teto_gasto,
            ativa,
            rubrica_global:rubricas_globais(nome)
          `,
        )
        .eq("projeto_id", projetoId)
        .order("data_criacao", { ascending: true }),
      supabase
        .from("tarefas")
        .select("id, titulo, status, data_entrega, hora_entrega")
        .eq("tipo", "pai")
        .eq("projeto_id", projetoId)
        .order("data_entrega", { ascending: true }),
    ]);

  if (erroProjeto) {
    throw new Error(`Erro ao buscar projeto: ${erroProjeto.message}`);
  }

  if (erroLinks) {
    throw new Error(`Erro ao buscar links do projeto: ${erroLinks.message}`);
  }

  if (erroRubricas) {
    throw new Error(`Erro ao buscar rubricas do projeto: ${erroRubricas.message}`);
  }

  if (erroObjetivos) {
    throw new Error(`Erro ao buscar objetivos do projeto: ${erroObjetivos.message}`);
  }

  if (!projeto) {
    return null;
  }

  const row = projeto as unknown as ProjetoDetalheRow;

  return {
    id: row.id,
    tipo: row.tipo,
    nome: row.nome,
    sigla: row.sigla,
    resumo: row.resumo,
    financiador_id: row.financiador_id,
    financiador_nome: extrairNomeRelacionamento(row.financiador),
    data_inicio: row.data_inicio,
    data_fim: row.data_fim,
    orcamento_total: row.orcamento_total,
    status: row.status,
    coordenador_id: row.coordenador_id,
    coordenador_nome: extrairNomeRelacionamento(row.coordenador),
    observacoes: row.observacoes,
    links: ((links ?? []) as ProjetoLinkRow[]).map((item) => ({
      id: item.id,
      titulo: item.titulo,
      url: item.url,
      ordem: item.ordem,
    })),
    rubricas: mapRubricasDetalhe((rubricas ?? []) as unknown as RubricaProjetoRow[]),
    objetivos: (objetivos ?? []) as ObjetivoResumoRow[],
    data_criacao: row.data_criacao,
    data_atualizacao: row.data_atualizacao,
  };
}

export async function listarCoordenadoresProjeto(): Promise<
  UsuarioCoordenadorProjetoOption[]
> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, perfil")
    .in("perfil", ["admin_supremo", "coordenador_geral", "coordenador_equipe"])
    .eq("status", "ativo")
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar coordenadores: ${error.message}`);
  }

  return (data ?? []) as UsuarioCoordenadorProjetoOption[];
}

export async function listarFinanciadoresProjeto(): Promise<
  FinanciadorProjetoOption[]
> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("financiadores")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar financiadores: ${error.message}`);
  }

  return (data ?? []) as FinanciadorProjetoOption[];
}

export async function criarFinanciadorProjeto(
  nome: string,
): Promise<FinanciadorProjetoOption> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("financiadores")
    .insert({
      nome: nome.trim(),
    })
    .select("id, nome")
    .single();

  if (error) {
    throw new Error(`Erro ao criar financiador: ${error.message}`);
  }

  return data as FinanciadorProjetoOption;
}

export async function listarRubricasGlobaisProjeto(): Promise<
  Array<{ id: string; nome: string }>
> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("rubricas_globais")
    .select("id, nome")
    .eq("ativa", true)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao listar rubricas globais: ${error.message}`);
  }

  return (data ?? []) as Array<{ id: string; nome: string }>;
}

export async function criarRubricaGlobalProjeto(nome: string) {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("rubricas_globais")
    .insert({
      nome: nome.trim(),
      ativa: true,
    })
    .select("id, nome")
    .single();

  if (error) {
    throw new Error(`Erro ao criar rubrica global: ${error.message}`);
  }

  return data as { id: string; nome: string };
}

export async function criarProjetoRepository(values: ProjetoFormData) {
  const supabase = await criarClienteSupabaseServidor();

  const { data: projeto, error: erroProjeto } = await supabase
    .from("projetos")
    .insert({
      tipo: values.tipo,
      nome: values.nome,
      sigla: values.sigla,
      resumo: values.resumo,
      financiador_id: values.financiador_id,
      data_inicio: values.data_inicio,
      data_fim: values.data_fim,
      orcamento_total: values.orcamento_total,
      status: values.status,
      coordenador_id: values.coordenador_id,
      observacoes: values.observacoes,
    })
    .select("id")
    .single();

  if (erroProjeto) {
    throw new Error(`Erro ao criar projeto: ${erroProjeto.message}`);
  }

  const projetoId = projeto.id as string;

  if (values.links.length > 0) {
    const { error: erroLinks } = await supabase.from("projeto_links").insert(
      values.links.map((item, index) => ({
        projeto_id: projetoId,
        titulo: item.titulo,
        url: item.url,
        ordem: index + 1,
      })),
    );

    if (erroLinks) {
      throw new Error(`Erro ao criar links do projeto: ${erroLinks.message}`);
    }
  }

  if (values.rubricas.length > 0) {
    const { error: erroRubricas } = await supabase.from("rubricas_projeto").insert(
      values.rubricas.map((item) => ({
        projeto_id: projetoId,
        rubrica_global_id: item.rubrica_global_id,
        limite_teto_gasto: item.limite_teto_gasto,
        ativa: true,
      })),
    );

    if (erroRubricas) {
      throw new Error(`Erro ao criar rubricas do projeto: ${erroRubricas.message}`);
    }
  }

  return projetoId;
}

export async function editarProjetoRepository(
  projetoId: string,
  values: ProjetoFormData,
) {
  const supabase = await criarClienteSupabaseServidor();

  const { error: erroProjeto } = await supabase
    .from("projetos")
    .update({
      tipo: values.tipo,
      nome: values.nome,
      sigla: values.sigla,
      resumo: values.resumo,
      financiador_id: values.financiador_id,
      data_inicio: values.data_inicio,
      data_fim: values.data_fim,
      orcamento_total: values.orcamento_total,
      status: values.status,
      coordenador_id: values.coordenador_id,
      observacoes: values.observacoes,
    })
    .eq("id", projetoId);

  if (erroProjeto) {
    throw new Error(`Erro ao editar projeto: ${erroProjeto.message}`);
  }

  const { error: erroExcluirLinks } = await supabase
    .from("projeto_links")
    .delete()
    .eq("projeto_id", projetoId);

  if (erroExcluirLinks) {
    throw new Error(`Erro ao substituir links do projeto: ${erroExcluirLinks.message}`);
  }

  if (values.links.length > 0) {
    const { error: erroInserirLinks } = await supabase
      .from("projeto_links")
      .insert(
        values.links.map((item, index) => ({
          projeto_id: projetoId,
          titulo: item.titulo,
          url: item.url,
          ordem: index + 1,
        })),
      );

    if (erroInserirLinks) {
      throw new Error(`Erro ao recriar links do projeto: ${erroInserirLinks.message}`);
    }
  }

  const { error: erroExcluirRubricas } = await supabase
    .from("rubricas_projeto")
    .delete()
    .eq("projeto_id", projetoId);

  if (erroExcluirRubricas) {
    throw new Error(
      `Erro ao substituir rubricas do projeto: ${erroExcluirRubricas.message}`,
    );
  }

  if (values.rubricas.length > 0) {
    const { error: erroInserirRubricas } = await supabase
      .from("rubricas_projeto")
      .insert(
        values.rubricas.map((item) => ({
          projeto_id: projetoId,
          rubrica_global_id: item.rubrica_global_id,
          limite_teto_gasto: item.limite_teto_gasto,
          ativa: true,
        })),
      );

    if (erroInserirRubricas) {
      throw new Error(
        `Erro ao recriar rubricas do projeto: ${erroInserirRubricas.message}`,
      );
    }
  }

  return projetoId;
}