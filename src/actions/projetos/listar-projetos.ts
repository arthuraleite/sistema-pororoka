"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { listarProjetosParaPagina } from "@/services/projetos/projetos.service";
import type {
  ProjetoListItem,
  ProjetosFiltros,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function listarProjetos(
  filtros?: ProjetosFiltros,
): Promise<ResultadoOperacaoProjeto<ProjetoListItem[]>> {
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

    const projetos = await listarProjetosParaPagina(user.id, filtros);

    return {
      sucesso: true,
      mensagem: "Projetos carregados com sucesso.",
      data: projetos,
    };
  } catch (error) {
    console.error("Erro ao listar projetos:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os projetos.",
    };
  }
}