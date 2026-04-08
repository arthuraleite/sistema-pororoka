"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { buscarResumoProjetosParaDashboard } from "@/services/projetos/projetos.service";
import type {
  ProjetosDashboardResumo,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function buscarDashboardProjetos(): Promise<
  ResultadoOperacaoProjeto<ProjetosDashboardResumo>
> {
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

    const resumo = await buscarResumoProjetosParaDashboard(user.id);

    return {
      sucesso: true,
      mensagem: "Resumo do dashboard carregado com sucesso.",
      data: resumo,
    };
  } catch (error) {
    console.error("Erro ao buscar dashboard de projetos:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o dashboard de projetos.",
    };
  }
}