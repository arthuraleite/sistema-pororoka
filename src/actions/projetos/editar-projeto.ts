"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { editarProjetoService } from "@/services/projetos/projetos.service";
import type {
  ProjetoFormData,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function editarProjeto(
  projetoId: string,
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

    const id = await editarProjetoService(user.id, projetoId, values);

    return {
      sucesso: true,
      mensagem: "Projeto atualizado com sucesso.",
      data: { id },
    };
  } catch (error) {
    console.error("Erro ao editar projeto:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o projeto.",
    };
  }
}