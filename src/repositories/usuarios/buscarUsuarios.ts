import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import type { UsuarioSistema } from "@/types/usuario.types";

type RegistroUsuarioBanco = {
  id: string;
  email: string;
  nome: string;
  perfil: UsuarioSistema["perfil"];
  equipe_id: string | null;
  avatar_url: string | null;
  status: UsuarioSistema["status"];
  ultimo_login_em: string | null;
  data_criacao: string;
  data_atualizacao: string;
};

export async function buscarUsuarios(): Promise<UsuarioSistema[]> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Erro ao buscar usuários internos.");
  }

  const registros = (data ?? []) as RegistroUsuarioBanco[];

  return registros.map((registro) => ({
    id: registro.id,
    email: registro.email,
    nome: registro.nome,
    perfil: registro.perfil,
    equipeId: registro.equipe_id,
    avatarUrl: registro.avatar_url,
    status: registro.status,
    ultimoLoginEm: registro.ultimo_login_em,
    dataCriacao: registro.data_criacao,
    dataAtualizacao: registro.data_atualizacao,
  }));
}