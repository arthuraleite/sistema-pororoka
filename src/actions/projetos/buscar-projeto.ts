"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { buscarProjetoDetalhado } from "@/services/projetos/projetos.service";
import type {
  ProjetoDetalhe,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function buscarProjeto(
  projetoId: string,
): Promise<ResultadoOperacaoProjeto<ProjetoDetalhe | null>> {
  try {
    const supabase = await criarClienteSupabaseServidor();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        sucesso: false,
        mensagem: "Sessão inválida. Faça login novamente.",
      };
    }

    const projeto = await buscarProjetoDetalhado(user.id, projetoId);

    return {
      sucesso: true,
      mensagem: "Projeto carregado com sucesso.",
      data: projeto,
    };
  } catch (error) {
    console.error("Erro ao buscar projeto:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o projeto.",
    };
  }
}