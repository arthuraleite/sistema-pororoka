"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarProjetoService } from "@/services/projetos/projetos.service";
import type {
  ProjetoFormData,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function criarProjeto(
  values: ProjetoFormData,
): Promise<ResultadoOperacaoProjeto<{ id: string }>> {
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

    const projetoId = await criarProjetoService(user.id, values);

    return {
      sucesso: true,
      mensagem: "Projeto criado com sucesso.",
      data: { id: projetoId },
    };
  } catch (error) {
    console.error("Erro ao criar projeto:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível criar o projeto.",
    };
  }
}