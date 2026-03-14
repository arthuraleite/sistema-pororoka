"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import type {
  ResultadoOperacaoTarefa,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

export async function buscarUsuarioAtualTarefas(): Promise<
  ResultadoOperacaoTarefa<UsuarioResumoTarefa | null>
> {
  try {
    const supabase = await criarClienteSupabaseServidor();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      return {
        sucesso: true,
        mensagem: "Usuário não autenticado.",
        data: null,
      };
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, email, avatar_url, perfil, status, equipe_id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        sucesso: true,
        mensagem: "Usuário autenticado sem registro institucional carregado.",
        data: null,
      };
    }

    return {
      sucesso: true,
      mensagem: "Usuário atual carregado com sucesso.",
      data: {
        id: data.id,
        nome: data.nome,
        email: data.email,
        avatarUrl: data.avatar_url ?? null,
        perfil: data.perfil,
        status: data.status,
        equipeId: data.equipe_id ?? null,
        equipeNome: null,
      },
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Erro ao carregar usuário atual.",
    };
  }
}