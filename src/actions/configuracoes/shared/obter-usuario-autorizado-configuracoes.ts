"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import type { UsuarioAutorizadoConfiguracoes } from "@/types/configuracoes/configuracoes.types";

export async function obterUsuarioAutorizadoConfiguracoes(): Promise<UsuarioAutorizadoConfiguracoes> {
  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id, perfil, status, equipe_id")
    .eq("id", user.id)
    .single();

  if (usuarioError || !usuario) {
    throw new Error("Usuário institucional não encontrado.");
  }

  return {
    id: usuario.id,
    perfil: usuario.perfil,
    status: usuario.status,
    equipeId: usuario.equipe_id,
  };
}