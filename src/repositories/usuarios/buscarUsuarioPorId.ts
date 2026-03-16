import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";

type EquipeResumo = {
  id: string;
  nome: string;
};

type UsuarioInterno = {
  id: string;
  email: string;
  nome: string;
  perfil: string;
  equipe_id: string | null;
  avatar_url: string | null;
  status: string;
  ultimo_login_em: string | null;
  data_criacao: string;
  data_atualizacao: string;
  equipe?: EquipeResumo | null;
};

export async function buscarUsuarioPorId(
  id: string,
): Promise<UsuarioInterno | null> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .maybeSingle<UsuarioInterno>();

  if (error) {
    throw new Error(`Erro ao buscar usuário interno: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  if (!data.equipe_id) {
    return {
      ...data,
      equipe: null,
    };
  }

  const { data: equipe, error: erroEquipe } = await supabase
    .from("equipes")
    .select("id, nome")
    .eq("id", data.equipe_id)
    .maybeSingle<EquipeResumo>();

  if (erroEquipe) {
    throw new Error(`Erro ao buscar equipe do usuário: ${erroEquipe.message}`);
  }

  return {
    ...data,
    equipe: equipe ?? null,
  };
}