"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { excluirTarefaSchema } from "@/schemas/tarefas/tarefa-operacional.schema";
import { TarefasService } from "@/services/tarefas/tarefas.service";
import type { ResultadoOperacaoTarefa } from "@/types/tarefas/tarefas.types";

type ExcluirTarefaActionInput = unknown;

export async function excluirTarefa(
  input: ExcluirTarefaActionInput,
): Promise<ResultadoOperacaoTarefa<void>> {
  try {
    const parsed = excluirTarefaSchema.parse(input);

    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasService(supabase);

    await service.excluir({
      id: parsed.id,
    });

    return {
      sucesso: true,
      mensagem: "Tarefa excluída com sucesso.",
    };
  } catch (error) {
    console.error("Erro bruto em excluirTarefa:", error);
    console.error(
      "Erro serializado em excluirTarefa:",
      JSON.stringify(error, null, 2),
    );

    const mensagem =
      typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

    return {
      sucesso: false,
      mensagem: `Erro ao excluir tarefa: ${mensagem}`,
    };
  }
}