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
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (usuarioError || !usuarioAtual) {
      return {
        sucesso: false,
        mensagem: "Não foi possível carregar o contexto do usuário.",
      };
    }

    const responsavelIds =
      input?.responsavelIds && input.responsavelIds.length > 0
        ? input.responsavelIds
        : [usuarioAtual.id];

    const data = await service.listar({
      filtros: {
        busca: input?.busca,
        status: input?.status,
        prioridades: input?.prioridades,
        categoriaIds: input?.categoriaIds,
        equipeIds: input?.equipeIds,
        responsavelIds,
        dataInicio: input?.dataInicio,
        dataFim: input?.dataFim,
        ocultarConcluidas: input?.ocultarConcluidas,
        apenasAtrasadas: input?.apenasAtrasadas,
        apenasMacros: input?.apenasMacros,
        apenasOperacionais: input?.apenasOperacionais,
      },
      pagina: input?.pagina ?? 1,
      limite: input?.limite ?? 50,
      contextoUsuario: {
        usuarioId: usuarioAtual.id,
        perfil: usuarioAtual.perfil,
        equipeId: usuarioAtual.equipe_id,
      },
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