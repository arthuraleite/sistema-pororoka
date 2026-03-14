"use server";

import { z } from "zod";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarComentarioTarefaSchema } from "@/schemas/tarefas/comentario-tarefa.schema";
import { TarefasComentariosService } from "@/services/tarefas/tarefas-comentarios.service";
import type {
  AdicionarComentarioInput,
  ResultadoOperacaoTarefa,
  TarefaComentario,
} from "@/types/tarefas/tarefas.types";

export async function adicionarComentario(
  input: unknown,
): Promise<ResultadoOperacaoTarefa<TarefaComentario>> {
  try {
    const parsed = criarComentarioTarefaSchema.parse(input);
    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasComentariosService(supabase);

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

    const payload: AdicionarComentarioInput = {
      tarefaId: parsed.tarefaId,
      comentarioPaiId: parsed.comentarioPaiId ?? null,
      conteudo: parsed.conteudo,
      linkExterno: parsed.linkExterno ?? null,
    };

    const data = await service.criar({
      input: payload,
      autorId: user.id,
    });

    return {
      sucesso: true,
      mensagem: "Comentário adicionado com sucesso.",
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        sucesso: false,
        mensagem: `Dados inválidos para adicionar comentário: ${JSON.stringify(
          error.flatten().fieldErrors,
        )}`,
      };
    }

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Erro ao adicionar comentário.",
    };
  }
}