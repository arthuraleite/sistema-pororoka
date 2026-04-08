"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { listarRubricasGlobaisProjetoService } from "@/services/projetos/projetos.service";
import type {
  ResultadoOperacaoProjeto,
  RubricaGlobalProjetoOption,
} from "@/types/projetos/projetos.types";

export async function listarRubricasGlobais(): Promise<
  ResultadoOperacaoProjeto<RubricaGlobalProjetoOption[]>
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

    const rubricas = await listarRubricasGlobaisProjetoService(user.id);

    return {
      sucesso: true,
      mensagem: "Rubricas globais carregadas com sucesso.",
      data: rubricas.map((item) => ({
        id: item.id,
        nome: item.nome,
        descricao: null,
      })),
    };
  } catch (error) {
    console.error("Erro ao listar rubricas globais:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível listar as rubricas globais.",
    };
  }
}