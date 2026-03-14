"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { TarefasService } from "@/services/tarefas/tarefas.service";
import type {
  ResultadoOperacaoTarefa,
  Tarefa,
  TarefasFiltros,
  TarefasPaginadas,
} from "@/types/tarefas/tarefas.types";

type ListarTarefasInput = TarefasFiltros & {
  pagina?: number;
  limite?: number;
};

export async function listarTarefas(
  input?: ListarTarefasInput,
): Promise<ResultadoOperacaoTarefa<TarefasPaginadas<Tarefa>>> {
  try {
    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasService(supabase);

    const data = await service.listar({
      filtros: {
        busca: input?.busca,
        status: input?.status,
        prioridades: input?.prioridades,
        categoriaIds: input?.categoriaIds,
        equipeIds: input?.equipeIds,
        responsavelIds: input?.responsavelIds,
        dataInicio: input?.dataInicio,
        dataFim: input?.dataFim,
        ocultarConcluidas: input?.ocultarConcluidas,
        apenasAtrasadas: input?.apenasAtrasadas,
        apenasMacros: input?.apenasMacros,
        apenasOperacionais: input?.apenasOperacionais,
      },
      pagina: input?.pagina ?? 1,
      limite: input?.limite ?? 50,
    });

    return {
      sucesso: true,
      mensagem: "Tarefas listadas com sucesso.",
      data,
    };
 } catch (error) {
    console.error("Erro bruto em listarTarefas:", error);
    console.error(
      "Erro serializado em listarTarefas:",
      JSON.stringify(error, null, 2),
    );

    const mensagem =
      typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

    return {
      sucesso: false,
      mensagem: `Erro ao listar tarefas: ${mensagem}`,
    };
  }
}