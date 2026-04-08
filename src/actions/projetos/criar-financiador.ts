"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarFinanciador } from "@/services/projetos/projetos.service";
import type {
  FinanciadorProjetoOption,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function criarFinanciadorAction({
  nome,
}: {
  nome: string;
}): Promise<ResultadoOperacaoProjeto<FinanciadorProjetoOption>> {
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

    const data = await criarFinanciador(user.id, nome);

    return {
      sucesso: true,
      mensagem: "Financiador criado com sucesso.",
      data,
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível criar o financiador.",
    };
  }
}