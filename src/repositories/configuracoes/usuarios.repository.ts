import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  PerfilUsuario,
  StatusUsuario,
  UsuarioDetalhe,
  UsuarioListItem,
} from "@/types/configuracoes/usuarios.types";

type CriarUsuarioInstitucionalInput = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  equipeId: string;
};

type EditarUsuarioInstitucionalInput = {
  id: string;
  nome: string;
  email: string;
  equipeId: string;
};

type AlterarPerfilUsuarioInput = {
  id: string;
  perfil: PerfilUsuario;
};

type AlterarStatusUsuarioInput = {
  id: string;
  status: StatusUsuario;
};

type UsuarioRowComEquipe = {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  equipe_id: string | null;
  data_criacao: string;
  data_atualizacao: string;
  equipes?: { nome: string } | { nome: string }[] | null;
};

function extrairNomeEquipe(
  equipes: UsuarioRowComEquipe["equipes"],
): string | null {
  if (!equipes) return null;

  if (Array.isArray(equipes)) {
    return equipes[0]?.nome ?? null;
  }

  return equipes.nome ?? null;
}

function mapearUsuarioListItem(item: UsuarioRowComEquipe): UsuarioListItem {
  return {
    id: item.id,
    nome: item.nome,
    email: item.email,
    perfil: item.perfil,
    status: item.status,
    equipeId: item.equipe_id,
    equipeNome: extrairNomeEquipe(item.equipes),
    createdAt: item.data_criacao,
    updatedAt: item.data_atualizacao,
  };
}

function mapearUsuarioDetalhe(item: UsuarioRowComEquipe): UsuarioDetalhe {
  return {
    id: item.id,
    nome: item.nome,
    email: item.email,
    perfil: item.perfil,
    status: item.status,
    equipeId: item.equipe_id,
    equipeNome: extrairNomeEquipe(item.equipes),
    createdAt: item.data_criacao,
    updatedAt: item.data_atualizacao,
  };
}

export class UsuariosRepository {
  async listar(): Promise<UsuarioListItem[]> {
    const supabase = await criarClienteSupabaseServidor();

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        nome,
        email,
        perfil,
        status,
        equipe_id,
        data_criacao,
        data_atualizacao,
        equipes (
          nome
        )
      `)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }

    return ((data ?? []) as UsuarioRowComEquipe[]).map(mapearUsuarioListItem);
  }

  async buscarPorId(id: string): Promise<UsuarioDetalhe | null> {
    const supabase = await criarClienteSupabaseServidor();

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        nome,
        email,
        perfil,
        status,
        equipe_id,
        data_criacao,
        data_atualizacao,
        equipes (
          nome
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }

    if (!data) return null;

    return mapearUsuarioDetalhe(data as UsuarioRowComEquipe);
  }

  async buscarPorEmail(email: string): Promise<UsuarioDetalhe | null> {
    const supabase = await criarClienteSupabaseServidor();

    const { data, error } = await supabase
      .from("usuarios")
      .select(`
        id,
        nome,
        email,
        perfil,
        status,
        equipe_id,
        data_criacao,
        data_atualizacao,
        equipes (
          nome
        )
      `)
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao buscar usuário por e-mail: ${error.message}`);
    }

    if (!data) return null;

    return mapearUsuarioDetalhe(data as UsuarioRowComEquipe);
  }

  async criar(input: CriarUsuarioInstitucionalInput): Promise<UsuarioDetalhe> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase
      .from("usuarios")
      .insert({
        id: input.id,
        nome: input.nome,
        email: input.email,
        perfil: input.perfil,
        equipe_id: input.equipeId,
        status: "ativo",
      })
      .select(`
        id,
        nome,
        email,
        perfil,
        status,
        equipe_id,
        data_criacao,
        data_atualizacao,
        equipes (
          nome
        )
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao criar usuário institucional: ${error.message}`);
    }

    return mapearUsuarioDetalhe(data as UsuarioRowComEquipe);
  }

  async editar(input: EditarUsuarioInstitucionalInput): Promise<UsuarioDetalhe> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase
      .from("usuarios")
      .update({
        nome: input.nome,
        email: input.email,
        equipe_id: input.equipeId,
        data_atualizacao: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select(`
        id,
        nome,
        email,
        perfil,
        status,
        equipe_id,
        data_criacao,
        data_atualizacao,
        equipes (
          nome
        )
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao editar usuário: ${error.message}`);
    }

    return mapearUsuarioDetalhe(data as UsuarioRowComEquipe);
  }

  async alterarPerfil(input: AlterarPerfilUsuarioInput): Promise<UsuarioDetalhe> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase
      .from("usuarios")
      .update({
        perfil: input.perfil,
        data_atualizacao: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select(`
        id,
        nome,
        email,
        perfil,
        status,
        equipe_id,
        data_criacao,
        data_atualizacao,
        equipes (
          nome
        )
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao alterar perfil do usuário: ${error.message}`);
    }

    return mapearUsuarioDetalhe(data as UsuarioRowComEquipe);
  }

  async alterarStatus(input: AlterarStatusUsuarioInput): Promise<UsuarioDetalhe> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase
      .from("usuarios")
      .update({
        status: input.status,
        data_atualizacao: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select(`
        id,
        nome,
        email,
        perfil,
        status,
        equipe_id,
        data_criacao,
        data_atualizacao,
        equipes (
          nome
        )
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao alterar status do usuário: ${error.message}`);
    }

    return mapearUsuarioDetalhe(data as UsuarioRowComEquipe);
  }
}