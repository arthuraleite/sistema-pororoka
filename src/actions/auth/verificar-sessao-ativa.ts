"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { verificarAcessoUsuario } from "@/services/auth/verificarAcessoUsuario";

export async function verificarSessaoAtivaAction() {
  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      autenticado: false,
      permitido: false,
      motivo: "sem_sessao" as const,
    };
  }

  const acesso = await verificarAcessoUsuario(user.id);

  if (!acesso.permitido) {
    return {
      autenticado: true,
      permitido: false,
      motivo: acesso.motivo,
    };
  }

  return {
    autenticado: true,
    permitido: true,
    motivo: null,
  };
}