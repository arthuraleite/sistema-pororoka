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

const EQUIPE_NOME = "Coordenação Geral";
const EQUIPE_DESCRICAO =
  "Coordenação Geral da Pororoka - Pode acessar quase todas as informações do sistema.";

const EMAIL = "arthur@pororoka.org";
const SENHA = "200327art";
const NOME = "Arthur";

async function garantirEquipe() {
  const { data: equipeExistente, error: selectError } = await supabase
    .from("equipes")
    .select("id, nome")
    .eq("nome", EQUIPE_NOME)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Erro ao buscar equipe base: ${selectError.message}`);
  }

  if (equipeExistente) {
    return equipeExistente.id;
  }

  const { data: equipeCriada, error: insertError } = await supabase
    .from("equipes")
    .insert({
      nome: EQUIPE_NOME,
      descricao: EQUIPE_DESCRICAO,
    })
    .select("id, nome")
    .single();

  if (insertError) {
    throw new Error(`Erro ao criar equipe base: ${insertError.message}`);
  }

  if (!equipeCriada?.id) {
    throw new Error("Equipe base criada sem retorno de id.");
  }

  return equipeCriada.id;
}

async function encontrarUsuarioAuthPorEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(`Erro ao listar usuários do Auth: ${error.message}`);
  }

  return (
    data.users.find(
      (user) => user.email && user.email.toLowerCase() === email.toLowerCase(),
    ) || null
  );
}

async function garantirUsuario(equipeId) {
  let authUser = await encontrarUsuarioAuthPorEmail(EMAIL);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: SENHA,
      email_confirm: true,
      user_metadata: {
        name: NOME,
        full_name: NOME,
      },
    });

    if (error) {
      throw new Error(`Erro ao criar usuário no Auth: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Usuário criado no Auth sem retorno de user.");
    }

    authUser = data.user;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: SENHA,
      email_confirm: true,
      user_metadata: {
        name: NOME,
        full_name: NOME,
      },
    });

    if (error) {
      throw new Error(
        `Erro ao atualizar usuário existente no Auth: ${error.message}`,
      );
    }
  }

  const { error: upsertError } = await supabase.from("usuarios").upsert(
    {
      id: authUser.id,
      email: EMAIL,
      nome: NOME,
      perfil: "admin_supremo",
      equipe_id: equipeId,
      status: "ativo",
    },
    {
      onConflict: "id",
    },
  );

  if (upsertError) {
    throw new Error(
      `Erro ao garantir usuário institucional: ${upsertError.message}`,
    );
  }

  console.log("Admin local garantido com sucesso.");
  console.log(`Email: ${EMAIL}`);
  console.log(`Senha: ${SENHA}`);
  console.log(`Equipe ID: ${equipeId}`);
}

async function main() {
  const equipeId = await garantirEquipe();
  await garantirUsuario(equipeId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});