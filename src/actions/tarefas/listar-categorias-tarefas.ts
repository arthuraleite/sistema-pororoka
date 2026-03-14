"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { TarefasCategoriasService } from "@/services/tarefas/tarefas-categorias.service";
import type {
  CategoriaTarefa,
  ResultadoOperacaoTarefa,
} from "@/types/tarefas/tarefas.types";

export async function listarCategoriasTarefas(params?: {
  ativo?: boolean;
}): Promise<ResultadoOperacaoTarefa<CategoriaTarefa[]>> {
  try {
    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasCategoriasService(supabase);

    const categorias = await service.listar({
      ativo: params?.ativo,
    });

    return {
      sucesso: true,
      mensagem: "Categorias carregadas com sucesso.",
      data: categorias,
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error ? error.message : "Erro ao listar categorias.",
    };
  }
}