"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import type { ResultadoOperacaoTarefa } from "@/types/tarefas/tarefas.types";

export type EquipeTarefaOption = {
  id: string;
  nome: string;
};

export async function listarEquipesTarefas(): Promise<
  ResultadoOperacaoTarefa<EquipeTarefaOption[]>
> {
  try {
    const supabase = await criarClienteSupabaseServidor();

    const { data, error } = await supabase
      .from("equipes")
      .select("id, nome")
      .order("nome", { ascending: true });

    if (error) throw error;

    return {
      sucesso: true,
      mensagem: "Equipes carregadas com sucesso.",
      data: (data ?? []).map((row) => ({
        id: row.id,
        nome: row.nome,
      })),
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error ? error.message : "Erro ao listar equipes.",
    };
  }
}