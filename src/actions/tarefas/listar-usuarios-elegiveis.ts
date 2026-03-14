"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import type {
  ResultadoOperacaoTarefa,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

export async function listarUsuariosElegiveis(): Promise<
  ResultadoOperacaoTarefa<UsuarioResumoTarefa[]>
> {
  try {
    const supabase = await criarClienteSupabaseServidor();

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, avatar_url, perfil, status, equipe_id")
      .eq("status", "ativo")
      .neq("perfil", "analista_financeiro")
      .order("nome", { ascending: true });

    if (error) throw error;

    const usuarios: UsuarioResumoTarefa[] = (data ?? []).map((row) => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      avatarUrl: row.avatar_url ?? null,
      perfil: row.perfil,
      status: row.status,
      equipeId: row.equipe_id ?? null,
      equipeNome: null,
    }));

    return {
      sucesso: true,
      mensagem: "Usuários elegíveis carregados com sucesso.",
      data: usuarios,
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Erro ao listar usuários elegíveis.",
    };
  }
}