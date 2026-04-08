"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarRubricaGlobalProjetoService } from "@/services/projetos/projetos.service";
import type {
  ResultadoOperacaoProjeto,
  RubricaGlobalProjetoOption,
} from "@/types/projetos/projetos.types";

export async function criarRubricaGlobal(
  nome: string,
): Promise<ResultadoOperacaoProjeto<RubricaGlobalProjetoOption>> {
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

    const rubrica = await criarRubricaGlobalProjetoService(user.id, nome);

    return {
      sucesso: true,
      mensagem: "Rubrica global criada com sucesso.",
      data: {
        id: rubrica.id,
        nome: rubrica.nome,
        descricao: null,
      },
    };
  } catch (error) {
    console.error("Erro ao criar rubrica global:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível criar a rubrica global.",
    };
  }
}