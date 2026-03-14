import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  EquipeCreateInput,
  EquipeDetalhe,
  EquipeEditInput,
  EquipeListItem,
} from "@/types/configuracoes/equipes.types";

export class EquipesRepository {
  async listar(): Promise<EquipeListItem[]> {
    const supabase = await criarClienteSupabaseServidor();

    const { data, error } = await supabase
      .from("equipes")
      .select("id, nome, descricao, data_criacao, data_atualizacao")
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar equipes: ${error.message}`);
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      nome: item.nome,
      descricao: item.descricao,
      createdAt: item.data_criacao,
      updatedAt: item.data_atualizacao,
    }));
  }

  async buscarPorId(id: string): Promise<EquipeDetalhe | null> {
    const supabase = await criarClienteSupabaseServidor();

    const [{ data: equipe, error: equipeError }, { count, error: countError }] =
      await Promise.all([
        supabase
          .from("equipes")
          .select("id, nome, descricao, data_criacao, data_atualizacao")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("usuarios")
          .select("*", { count: "exact", head: true })
          .eq("equipe_id", id),
      ]);

    if (equipeError) {
      throw new Error(`Erro ao buscar equipe: ${equipeError.message}`);
    }

    if (countError) {
      throw new Error(`Erro ao contar usuários da equipe: ${countError.message}`);
    }

    if (!equipe) return null;

    return {
      id: equipe.id,
      nome: equipe.nome,
      descricao: equipe.descricao,
      createdAt: equipe.data_criacao,
      updatedAt: equipe.data_atualizacao,
      totalUsuarios: count ?? 0,
    };
  }

  async buscarPorNome(nome: string): Promise<EquipeDetalhe | null> {
    const supabase = await criarClienteSupabaseServidor();

    const { data, error } = await supabase
      .from("equipes")
      .select("id, nome, descricao, data_criacao, data_atualizacao")
      .ilike("nome", nome)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar equipe por nome: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao,
      createdAt: data.data_criacao,
      updatedAt: data.data_atualizacao,
    };
  }

  async criar(input: EquipeCreateInput): Promise<EquipeDetalhe> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase
      .from("equipes")
      .insert({
        nome: input.nome,
        descricao: input.descricao ?? null,
      })
      .select("id, nome, descricao, data_criacao, data_atualizacao")
      .single();

    if (error) {
      throw new Error(`Erro ao criar equipe: ${error.message}`);
    }

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao,
      createdAt: data.data_criacao,
      updatedAt: data.data_atualizacao,
      totalUsuarios: 0,
    };
  }

  async editar(input: EquipeEditInput): Promise<EquipeDetalhe> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase
      .from("equipes")
      .update({
        nome: input.nome,
        descricao: input.descricao ?? null,
        data_atualizacao: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select("id, nome, descricao, data_criacao, data_atualizacao")
      .single();

    if (error) {
      throw new Error(`Erro ao editar equipe: ${error.message}`);
    }

    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao,
      createdAt: data.data_criacao,
      updatedAt: data.data_atualizacao,
    };
  }
}