import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";

export async function buscarUsuarioPorId(id: string) {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar usuário interno: ${error.message}`);
  }

  return data;
}