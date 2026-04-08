"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { listarCoordenadoresProjetoService } from "@/services/projetos/projetos.service";
import type {
  ResultadoOperacaoProjeto,
  UsuarioCoordenadorProjetoOption,
} from "@/types/projetos/projetos.types";

export async function listarCoordenadoresProjetos(): Promise<
  ResultadoOperacaoProjeto<UsuarioCoordenadorProjetoOption[]>
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

    const coordenadores = await listarCoordenadoresProjetoService(user.id);

    return {
      sucesso: true,
      mensagem: "Coordenadores carregados com sucesso.",
      data: coordenadores,
    };
  } catch (error) {
    console.error("Erro ao listar coordenadores dos projetos:", error);

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível listar os coordenadores.",
    };
  }
}