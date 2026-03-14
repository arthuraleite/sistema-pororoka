"use server";

import { z } from "zod";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { moverTarefaStatusSchema } from "@/schemas/tarefas/tarefa-operacional.schema";
import { TarefasService } from "@/services/tarefas/tarefas.service";
import type {
  ResultadoOperacaoTarefa,
  TarefaDetalhe,
} from "@/types/tarefas/tarefas.types";

export async function moverTarefaStatus(
  input: unknown,
): Promise<ResultadoOperacaoTarefa<TarefaDetalhe>> {
  try {
    const parsed = moverTarefaStatusSchema.parse(input);
    const supabase = await criarClienteSupabaseServidor();

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

    const service = new TarefasService(supabase);

    const data = await service.moverStatus({
      id: parsed.id,
      novoStatus: parsed.novoStatus,
    });

    return {
      sucesso: true,
      mensagem: "Status da tarefa atualizado com sucesso.",
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        sucesso: false,
        mensagem: `Dados inválidos para mover a tarefa: ${JSON.stringify(
          error.flatten().fieldErrors,
        )}`,
      };
    }

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Erro ao mover status da tarefa.",
    };
  }
}