"use server";

import { z } from "zod";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { desativarCategoriaTarefaSchema } from "@/schemas/tarefas/categoria-tarefa.schema";
import { TarefasCategoriasService } from "@/services/tarefas/tarefas-categorias.service";
import type {
  CategoriaTarefa,
  ResultadoOperacaoTarefa,
} from "@/types/tarefas/tarefas.types";

export async function desativarCategoriaTarefa(
  input: unknown,
): Promise<ResultadoOperacaoTarefa<CategoriaTarefa>> {
  try {
    const parsed = desativarCategoriaTarefaSchema.parse(input);
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

    const data = await service.desativar({
      id: parsed.id,
      usuarioId: user.id,
    });

    return {
      sucesso: true,
      mensagem: "Categoria desativada com sucesso.",
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        sucesso: false,
        mensagem: `Dados inválidos para desativação da categoria: ${JSON.stringify(
          error.flatten().fieldErrors,
        )}`,
      };
    }

    return {
      sucesso: false,
      mensagem:
        error instanceof Error ? error.message : "Erro ao desativar categoria.",
    };
  }
}