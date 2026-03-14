require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definida.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY não está definida.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SENHA_PADRAO = "1234";
const PREFIXO_SEED = "[SEED POROROKA 2026]";

const EQUIPES = [
  {
    nome: "Coordenação Geral",
    descricao:
      "Equipe responsável pela coordenação geral do sistema e da organização.",
  },
  {
    nome: "Comunicação",
    descricao: "Equipe de comunicação e mobilização.",
  },
  {
    nome: "Financeiro",
    descricao: "Equipe de gestão financeira.",
  },
];

const USUARIOS = [
  {
    nome: "Arthur Leite",
    email: "arthur@pororoka.org",
    perfil: "admin_supremo",
    equipeNome: "Coordenação Geral",
  },
  {
    nome: "João Pedro",
    email: "joao@pororoka.org",
    perfil: "coordenador_geral",
    equipeNome: "Coordenação Geral",
  },
  {
    nome: "Leo",
    email: "leo@pororoka.org",
    perfil: "gestor_financeiro",
    equipeNome: "Financeiro",
  },
  {
    nome: "Lais Nunes",
    email: "lais.comunicacao@pororoka.org",
    perfil: "coordenador_equipe",
    equipeNome: "Comunicação",
  },
  {
    nome: "Lucas Freire",
    email: "lucas.comunicacao@pororoka.org",
    perfil: "assistente",
    equipeNome: "Comunicação",
  },
  {
    nome: "Julia Martins",
    email: "julia.comunicacao@pororoka.org",
    perfil: "membro",
    equipeNome: "Comunicação",
  },
];

const CATEGORIAS = [
  {
    equipeNome: "Comunicação",
    nome: "Campanhas",
    descricao: "Campanhas, peças e ações de comunicação.",
  },
  {
    equipeNome: "Comunicação",
    nome: "Redes Sociais",
    descricao: "Planejamento e execução de conteúdos para redes.",
  },
  {
    equipeNome: "Financeiro",
    nome: "Prestação de Contas",
    descricao: "Atividades ligadas à prestação e organização financeira.",
  },
];

async function encontrarUsuarioAuthPorEmail(email) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Erro ao listar usuários do Auth: ${error.message}`);
    }

    const encontrado =
      data.users.find(
        (user) => user.email && user.email.toLowerCase() === email.toLowerCase(),
      ) || null;

    if (encontrado) return encontrado;
    if (!data.users.length || data.users.length < perPage) return null;

    page += 1;
  }
}

async function garantirEquipe(nome, descricao) {
  const { data: existente, error: selectError } = await supabase
    .from("equipes")
    .select("id, nome")
    .eq("nome", nome)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Erro ao buscar equipe "${nome}": ${selectError.message}`);
  }

  if (existente) return existente;

  const { data: criada, error: insertError } = await supabase
    .from("equipes")
    .insert({
      nome,
      descricao,
    })
    .select("id, nome")
    .single();

  if (insertError) {
    throw new Error(`Erro ao criar equipe "${nome}": ${insertError.message}`);
  }

  return criada;
}

async function garantirUsuario(usuario, equipeId) {
  let authUser = await encontrarUsuarioAuthPorEmail(usuario.email);
    
  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: usuario.email,
      password: SENHA_PADRAO,
      email_confirm: true,
      user_metadata: {
        name: usuario.nome,
        full_name: usuario.nome,
      },
    });

    if (error) {
      throw new Error(
        `Erro ao criar usuário Auth ${usuario.email}: ${error.message}`,
      );
    }

    if (!data.user) {
      throw new Error(`Usuário Auth ${usuario.email} criado sem retorno.`);
    }

    authUser = data.user;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: SENHA_PADRAO,
      email_confirm: true,
      user_metadata: {
        name: usuario.nome,
        full_name: usuario.nome,
      },
    });

    if (error) {
      throw new Error(
        `Erro ao atualizar usuário Auth ${usuario.email}: ${error.message}`,
      );
    }
  }

  const { error: upsertError } = await supabase.from("usuarios").upsert(
    {
      id: authUser.id,
      email: usuario.email,
      nome: usuario.nome,
      perfil: usuario.perfil,
      equipe_id: equipeId,
      status: "ativo",
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    throw new Error(
      `Erro ao garantir usuário ${usuario.email} em public.usuarios: ${upsertError.message}`,
    );
  }

  return {
    id: authUser.id,
    email: usuario.email,
    nome: usuario.nome,
    perfil: usuario.perfil,
    equipeId,
  };
}

async function garantirCategoria({
  equipeId,
  nome,
  descricao,
  criadoPorId,
}) {
  const { data: existente, error: selectError } = await supabase
    .from("categorias_tarefa")
    .select("id, nome, equipe_id")
    .eq("equipe_id", equipeId)
    .ilike("nome", nome)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Erro ao buscar categoria "${nome}": ${selectError.message}`);
  }

  if (existente) return existente;

  const { data: criada, error: insertError } = await supabase
    .from("categorias_tarefa")
    .insert({
      equipe_id: equipeId,
      nome,
      descricao: descricao ?? null,
      criado_por_id: criadoPorId,
      atualizado_por_id: criadoPorId,
    })
    .select("id, nome, equipe_id")
    .single();

  if (insertError) {
    throw new Error(`Erro ao criar categoria "${nome}": ${insertError.message}`);
  }

  return criada;
}

async function buscarTarefaPorTitulo(tipo, titulo) {
  const { data, error } = await supabase
    .from("tarefas")
    .select("id, tipo, titulo")
    .eq("tipo", tipo)
    .eq("titulo", titulo)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar tarefa "${titulo}": ${error.message}`);
  }

  return data || null;
}

async function substituirResponsaveisDaTarefa(
  tarefaId,
  responsavelIds,
  atribuidoPorId,
) {
  const { error: deleteError } = await supabase
    .from("tarefas_responsaveis")
    .delete()
    .eq("tarefa_id", tarefaId);

  if (deleteError) {
    throw new Error(
      `Erro ao limpar responsáveis da tarefa ${tarefaId}: ${deleteError.message}`,
    );
  }

  if (!responsavelIds.length) return;

  const payload = responsavelIds.map((usuarioId) => ({
    tarefa_id: tarefaId,
    usuario_id: usuarioId,
    atribuido_por_id: atribuidoPorId,
  }));

  const { error: insertError } = await supabase
    .from("tarefas_responsaveis")
    .insert(payload);

  if (insertError) {
    throw new Error(
      `Erro ao inserir responsáveis da tarefa ${tarefaId}: ${insertError.message}`,
    );
  }
}

async function substituirLinksDaTarefa(tarefaId, links, criadoPorId) {
  const { error: deleteError } = await supabase
    .from("tarefas_links")
    .delete()
    .eq("tarefa_id", tarefaId);

  if (deleteError) {
    throw new Error(
      `Erro ao limpar links da tarefa ${tarefaId}: ${deleteError.message}`,
    );
  }

  if (!links.length) return;

  const payload = links.map((link) => ({
    tarefa_id: tarefaId,
    url: link.url,
    texto: link.texto ?? null,
    criado_por_id: criadoPorId,
  }));

  const { error: insertError } = await supabase
    .from("tarefas_links")
    .insert(payload);

  if (insertError) {
    throw new Error(
      `Erro ao inserir links da tarefa ${tarefaId}: ${insertError.message}`,
    );
  }
}

async function garantirTarefa({
  tipo,
  escopoObjetivo = null,
  titulo,
  descricao = null,
  tarefaPaiId = null,
  equipeId = null,
  categoriaId = null,
  projetoId = null,
  prioridade = null,
  status = "a_fazer",
  dataEntrega,
  horaEntrega = null,
  criadoPorId,
  atualizadoPorId,
  responsavelIds = [],
  links = [],
}) {
  const existente = await buscarTarefaPorTitulo(tipo, titulo);

  let tarefaId;

  if (existente) {
    tarefaId = existente.id;

    const { error: updateError } = await supabase
      .from("tarefas")
      .update({
        escopo_objetivo: escopoObjetivo,
        titulo,
        descricao,
        tarefa_pai_id: tarefaPaiId,
        equipe_id: equipeId,
        categoria_id: categoriaId,
        projeto_id: projetoId,
        prioridade,
        status,
        data_entrega: dataEntrega,
        hora_entrega: horaEntrega,
        atualizado_por_id: atualizadoPorId,
      })
      .eq("id", tarefaId);

    if (updateError) {
      throw new Error(`Erro ao atualizar tarefa "${titulo}": ${updateError.message}`);
    }
  } else {
    const { data: criada, error: insertError } = await supabase
      .from("tarefas")
      .insert({
        tipo,
        escopo_objetivo: escopoObjetivo,
        titulo,
        descricao,
        tarefa_pai_id: tarefaPaiId,
        equipe_id: equipeId,
        categoria_id: categoriaId,
        projeto_id: projetoId,
        prioridade,
        status,
        data_entrega: dataEntrega,
        hora_entrega: horaEntrega,
        criado_por_id: criadoPorId,
        atualizado_por_id: atualizadoPorId,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Erro ao criar tarefa "${titulo}": ${insertError.message}`);
    }

    tarefaId = criada.id;
  }

  await substituirResponsaveisDaTarefa(tarefaId, responsavelIds, atualizadoPorId);
  await substituirLinksDaTarefa(tarefaId, links, atualizadoPorId);

  return tarefaId;
}

async function main() {
  console.log("Iniciando seed do Sistema Pororoka...");

  const equipesMap = new Map();
  for (const equipe of EQUIPES) {
    const equipeGarantida = await garantirEquipe(equipe.nome, equipe.descricao);
    equipesMap.set(equipe.nome, equipeGarantida.id);
  }

  const usuariosMap = new Map();
  for (const usuario of USUARIOS) {
    const equipeId = equipesMap.get(usuario.equipeNome);
    const usuarioGarantido = await garantirUsuario(usuario, equipeId);
    usuariosMap.set(usuario.email, usuarioGarantido);
  }

  const admin = usuariosMap.get("arthur@pororoka.org");
  const coordenadorGeral = usuariosMap.get("joao@pororoka.org");
  const gestorFinanceiro = usuariosMap.get("leo@pororoka.org");
  const coordComunicacao = usuariosMap.get("lais.comunicacao@pororoka.org");
  const assistenteComunicacao = usuariosMap.get("lucas.comunicacao@pororoka.org");
  const membroComunicacao = usuariosMap.get("julia.comunicacao@pororoka.org");

  if (
    !admin ||
    !coordenadorGeral ||
    !gestorFinanceiro ||
    !coordComunicacao ||
    !assistenteComunicacao ||
    !membroComunicacao
  ) {
    throw new Error(
      "Seed inconsistente: um ou mais usuários principais não foram garantidos.",
    );
  }

  const categoriasMap = new Map();
  for (const categoria of CATEGORIAS) {
    const equipeId = equipesMap.get(categoria.equipeNome);

    const categoriaGarantida = await garantirCategoria({
      equipeId,
      nome: `${PREFIXO_SEED} ${categoria.nome}`,
      descricao: categoria.descricao,
      criadoPorId: admin.id,
    });

    categoriasMap.set(`${categoria.equipeNome}:${categoria.nome}`, categoriaGarantida.id);
  }

  const objetivoGlobalId = await garantirTarefa({
    tipo: "pai",
    escopoObjetivo: "global",
    titulo: `${PREFIXO_SEED} Objetivo Global - Campanha Proteja a Amazônia`,
    descricao:
      "Objetivo global fictício para testar visibilidade institucional e tarefas vinculadas de múltiplas equipes.",
    equipeId: null,
    categoriaId: null,
    prioridade: "alta",
    status: "em_andamento",
    dataEntrega: "2026-04-30",
    horaEntrega: "18:00",
    criadoPorId: coordenadorGeral.id,
    atualizadoPorId: coordenadorGeral.id,
    responsavelIds: [admin.id, coordenadorGeral.id],
    links: [
      {
        url: "https://example.org/proteja-amazonia-objetivo-global",
        texto: "Referência do objetivo global",
      },
    ],
  });

  const objetivoEquipeComunicacaoId = await garantirTarefa({
    tipo: "pai",
    escopoObjetivo: "equipe",
    titulo: `${PREFIXO_SEED} Objetivo de Equipe - Calendário editorial de abril`,
    descricao:
      "Objetivo de equipe fictício para testar o escopo de objetivos da equipe de Comunicação.",
    equipeId: equipesMap.get("Comunicação"),
    categoriaId: null,
    prioridade: "media",
    status: "a_fazer",
    dataEntrega: "2026-04-10",
    horaEntrega: "17:30",
    criadoPorId: coordComunicacao.id,
    atualizadoPorId: coordComunicacao.id,
    responsavelIds: [coordComunicacao.id, assistenteComunicacao.id],
    links: [
      {
        url: "https://example.org/calendario-editorial-abril",
        texto: "Documento-base do calendário editorial",
      },
    ],
  });

  await garantirTarefa({
    tipo: "filha",
    escopoObjetivo: null,
    titulo: `${PREFIXO_SEED} Filha - Produzir manifesto visual da campanha`,
    descricao:
      "Tarefa filha vinculada ao objetivo global, executada pela equipe de Comunicação.",
    tarefaPaiId: objetivoGlobalId,
    equipeId: equipesMap.get("Comunicação"),
    categoriaId: categoriasMap.get("Comunicação:Campanhas"),
    prioridade: "alta",
    status: "em_andamento",
    dataEntrega: "2026-04-05",
    horaEntrega: "15:00",
    criadoPorId: admin.id,
    atualizadoPorId: admin.id,
    responsavelIds: [
      coordComunicacao.id,
      assistenteComunicacao.id,
      membroComunicacao.id,
    ],
    links: [
      {
        url: "https://example.org/manifesto-visual",
        texto: "Briefing visual",
      },
    ],
  });

  await garantirTarefa({
    tipo: "filha",
    escopoObjetivo: null,
    titulo: `${PREFIXO_SEED} Filha - Organizar orçamento da mobilização`,
    descricao:
      "Tarefa filha vinculada ao objetivo global, executada pela equipe Financeira.",
    tarefaPaiId: objetivoGlobalId,
    equipeId: equipesMap.get("Financeiro"),
    categoriaId: categoriasMap.get("Financeiro:Prestação de Contas"),
    prioridade: "media",
    status: "a_fazer",
    dataEntrega: "2026-04-07",
    horaEntrega: "12:00",
    criadoPorId: gestorFinanceiro.id,
    atualizadoPorId: gestorFinanceiro.id,
    responsavelIds: [gestorFinanceiro.id],
    links: [],
  });

  await garantirTarefa({
    tipo: "filha",
    escopoObjetivo: null,
    titulo: `${PREFIXO_SEED} Filha - Fechar calendário de publicações`,
    descricao: "Tarefa filha do objetivo da equipe de Comunicação.",
    tarefaPaiId: objetivoEquipeComunicacaoId,
    equipeId: equipesMap.get("Comunicação"),
    categoriaId: categoriasMap.get("Comunicação:Redes Sociais"),
    prioridade: "alta",
    status: "atencao",
    dataEntrega: "2026-04-04",
    horaEntrega: "11:00",
    criadoPorId: coordComunicacao.id,
    atualizadoPorId: coordComunicacao.id,
    responsavelIds: [coordComunicacao.id, assistenteComunicacao.id],
    links: [],
  });

  await garantirTarefa({
    tipo: "filha",
    escopoObjetivo: null,
    titulo: `${PREFIXO_SEED} Filha - Produzir cards da semana 1`,
    descricao: "Tarefa filha do objetivo da equipe de Comunicação.",
    tarefaPaiId: objetivoEquipeComunicacaoId,
    equipeId: equipesMap.get("Comunicação"),
    categoriaId: categoriasMap.get("Comunicação:Redes Sociais"),
    prioridade: "media",
    status: "a_fazer",
    dataEntrega: "2026-04-06",
    horaEntrega: "14:30",
    criadoPorId: assistenteComunicacao.id,
    atualizadoPorId: assistenteComunicacao.id,
    responsavelIds: [assistenteComunicacao.id, membroComunicacao.id],
    links: [],
  });

  await garantirTarefa({
    tipo: "orfa",
    escopoObjetivo: null,
    titulo: `${PREFIXO_SEED} Tarefa Órfã - Revisar contratos de fornecedores`,
    descricao:
      "Tarefa operacional sem objetivo pai para testes da equipe Financeira.",
    equipeId: equipesMap.get("Financeiro"),
    categoriaId: categoriasMap.get("Financeiro:Prestação de Contas"),
    prioridade: "urgente",
    status: "em_atraso",
    dataEntrega: "2026-03-25",
    horaEntrega: "10:00",
    criadoPorId: gestorFinanceiro.id,
    atualizadoPorId: gestorFinanceiro.id,
    responsavelIds: [gestorFinanceiro.id],
    links: [
      {
        url: "https://example.org/fornecedores",
        texto: "Planilha de fornecedores",
      },
    ],
  });

  await garantirTarefa({
    tipo: "orfa",
    escopoObjetivo: null,
    titulo: `${PREFIXO_SEED} Tarefa Órfã - Agendar reunião de alinhamento`,
    descricao:
      "Tarefa operacional da equipe de Comunicação para testar listagem e responsáveis.",
    equipeId: equipesMap.get("Comunicação"),
    categoriaId: categoriasMap.get("Comunicação:Campanhas"),
    prioridade: "baixa",
    status: "a_fazer",
    dataEntrega: "2026-04-03",
    horaEntrega: "09:30",
    criadoPorId: coordComunicacao.id,
    atualizadoPorId: coordComunicacao.id,
    responsavelIds: [
      coordComunicacao.id,
      assistenteComunicacao.id,
      membroComunicacao.id,
    ],
    links: [],
  });

  console.log("Seed concluído com sucesso.");
  console.log("");
  console.log("Usuários criados/garantidos:");
  for (const usuario of USUARIOS) {
    console.log(
      `- ${usuario.email} | senha: ${SENHA_PADRAO} | perfil: ${usuario.perfil}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});