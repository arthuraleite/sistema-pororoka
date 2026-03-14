import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";

type AuditoriaInput = {
  atorId: string;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  detalhes?: Record<string, unknown> | null;
};

export class AuditoriaRepository {
  async registrar(input: AuditoriaInput): Promise<void> {
    const supabase = criarClienteSupabaseAdmin();

    const { error } = await supabase.from("auditoria_eventos").insert({
      ator_id: input.atorId,
      acao: input.acao,
      entidade: input.entidade,
      entidade_id: input.entidadeId ?? null,
      detalhes: input.detalhes ?? null,
    });

    if (error) {
      throw new Error(`Erro ao registrar auditoria: ${error.message}`);
    }
  }
}