"use server";

import { z } from "zod";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { gerirResponsaveisTarefaSchema } from "@/schemas/tarefas/tarefa-operacional.schema";
import { TarefasResponsaveisService } from "@/services/tarefas/tarefas-responsaveis.service";
import type {
  ResultadoOperacaoTarefa,
  TarefaResponsavel,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

async function carregarUsuariosDisponiveis(): Promise<UsuarioResumoTarefa[]> {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, avatar_url, perfil, status, equipe_id")
    .eq("status", "ativo");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    email: row.email,
    avatarUrl: row.avatar_url ?? null,
    perfil: row.perfil,
    status: row.status,
    equipeId: row.equipe_id ?? null,
    equipeNome: null,
  })) as UsuarioResumoTarefa[];
}

export async function gerirResponsaveis(
  input: unknown,
): Promise<
  ResultadoOperacaoTarefa<{
    atuais: TarefaResponsavel[];
    adicionados: string[];
    removidos: string[];
  }>
> {
  try {
    const parsed = gerirResponsaveisTarefaSchema.parse(input);
    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasResponsaveisService(supabase);

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

    const tarefa = await service.buscarTarefaObrigatoria(parsed.tarefaId);
    const usuariosDisponiveis = await carregarUsuariosDisponiveis();

    await service.validarResponsaveisParaTarefa({
      tarefa,
      responsavelIds: parsed.responsavelIds,
      usuariosDisponiveis,
    });

    const data = await service.sincronizarResponsaveis({
      tarefaId: parsed.tarefaId,
      responsavelIdsFinais: parsed.responsavelIds,
      alteradoPorId: user.id,
    });

    return {
      sucesso: true,
      mensagem: "Responsáveis atualizados com sucesso.",
      data,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        sucesso: false,
        mensagem: `Dados inválidos para gerir responsáveis: ${JSON.stringify(
          error.flatten().fieldErrors,
        )}`,
      };
    }

    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar responsáveis.",
    };
  }
}