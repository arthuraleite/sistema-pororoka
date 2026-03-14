"use server";

import { z } from "zod";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarCategoriaTarefaSchema } from "@/schemas/tarefas/categoria-tarefa.schema";
import { TarefasCategoriasService } from "@/services/tarefas/tarefas-categorias.service";
import type {
  CriarCategoriaTarefaInput,
  CategoriaTarefa,
  ResultadoOperacaoTarefa,
} from "@/types/tarefas/tarefas.types";

export async function criarCategoriaTarefa(
  input: unknown,
): Promise<ResultadoOperacaoTarefa<CategoriaTarefa>> {
  try {
    const parsed = criarCategoriaTarefaSchema.parse(input);
    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasCategoriasService(supabase);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) {
      return {
        sucesso: false,
        mensagem: "Usuário não autenticado.",
      };
    }

    const data = await service.criar({
      input: parsed as CriarCategoriaTarefaInput,
      usuarioId: user.id,
    });

    return {
      sucesso: true,
      mensagem: "Categoria criada com sucesso.",
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        sucesso: false,
        mensagem: "Dados inválidos para criação da categoria.",
        // erros: error.flatten().fieldErrors,
      };
    }

    return {
      sucesso: false,
      mensagem:
        error instanceof Error ? error.message : "Erro ao criar categoria.",
    };
  }
}