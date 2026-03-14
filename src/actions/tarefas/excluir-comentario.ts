"use server";

import { z } from "zod";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { excluirComentarioTarefaSchema } from "@/schemas/tarefas/comentario-tarefa.schema";
import { TarefasComentariosService } from "@/services/tarefas/tarefas-comentarios.service";
import type {
  ResultadoOperacaoTarefa,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

async function carregarSolicitante(userId: string): Promise<UsuarioResumoTarefa> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, avatar_url, perfil, status, equipe_id")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    avatarUrl: data.avatar_url ?? null,
    perfil: data.perfil,
    status: data.status,
    equipeId: data.equipe_id ?? null,
    equipeNome: null,
  };
}

export async function excluirComentario(
  input: unknown,
): Promise<ResultadoOperacaoTarefa<void>> {
  try {
    const parsed = excluirComentarioTarefaSchema.parse(input);
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

    const solicitante = await carregarSolicitante(user.id);

    await service.excluir({
      comentarioId: parsed.comentarioId,
      solicitante,
    });

    return {
      sucesso: true,
      mensagem: "Comentário excluído com sucesso.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        sucesso: false,
        mensagem: `Dados inválidos para exclusão do comentário: ${JSON.stringify(
          error.flatten().fieldErrors,
        )}`,
      };
    }

    return {
      sucesso: false,
      mensagem:
        error instanceof Error ? error.message : "Erro ao excluir comentário.",
    };
  }
}