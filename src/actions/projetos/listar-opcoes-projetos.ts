"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { listarOpcoesProjetosParaFormulario } from "@/services/projetos/projetos.service";
import type {
  OpcoesProjetos,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function listarOpcoesProjetos(): Promise<
  ResultadoOperacaoProjeto<OpcoesProjetos>
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

    const data = await listarOpcoesProjetosParaFormulario(user.id);

    return {
      sucesso: true,
      mensagem: "Opções carregadas com sucesso.",
      data,
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as opções de projetos.",
    };
  }
}