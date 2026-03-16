"use server";

import { z } from "zod";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { uuidSchema } from "@/schemas/tarefas/tarefa-status.schema";
import { TarefasService } from "@/services/tarefas/tarefas.service";
import type {
  ResultadoOperacaoTarefa,
  TarefaDetalhe,
} from "@/types/tarefas/tarefas.types";

const buscarTarefaSchema = z.object({
  tarefaId: uuidSchema,
});

export async function buscarTarefa(
  input: unknown,
): Promise<ResultadoOperacaoTarefa<TarefaDetalhe>> {
  try {
    const parsed = buscarTarefaSchema.parse(input);
    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasService(supabase);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return {
        sucesso: false,
        mensagem: "Não foi possível identificar o usuário autenticado.",
      };
    }

    const { data: usuarioAtual, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, perfil, equipe_id")
      .eq("id", user.id)
      .maybeSingle();

    if (usuarioError || !usuarioAtual) {
      return {
        sucesso: false,
        mensagem: "Não foi possível carregar o contexto do usuário.",
      };
    }

    const data = await service.buscarPorId(parsed.tarefaId, {
      usuarioId: usuarioAtual.id,
      perfil: usuarioAtual.perfil,
      equipeId: usuarioAtual.equipe_id,
    });

    if (!data) {
      return {
        sucesso: false,
        mensagem: "Tarefa não encontrada.",
      };
    }

    return {
      sucesso: true,
      mensagem: "Tarefa carregada com sucesso.",
      data,
    };
  } catch (error) {
    console.error("Erro bruto em buscarTarefa:", error);
    console.error(
      "Erro serializado em buscarTarefa:",
      JSON.stringify(error, null, 2),
    );

    const mensagem =
      typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

    return {
      sucesso: false,
      mensagem: `Erro ao buscar tarefa: ${mensagem}`,
    };
  }
}