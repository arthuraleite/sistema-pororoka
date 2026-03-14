import { criarClienteSupabaseAdmin } from "@/lib/supabase/admin";

type ProvisionarUsuarioAuthInput = {
  email: string;
  nome: string;
};

type ProvisionarUsuarioAuthOutput = {
  id: string;
  email: string;
};

export class ProvisionamentoUsuarioAuthService {
  private readonly senhaPadraoInicial = "1234";

  async criarConta(input: ProvisionarUsuarioAuthInput): Promise<ProvisionarUsuarioAuthOutput> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase.auth.admin.createUser({
      email: input.email,
      password: this.senhaPadraoInicial,
      email_confirm: true,
      user_metadata: {
        name: input.nome,
        full_name: input.nome,
      },
    });

    if (error) {
      throw new Error(`Erro ao criar conta no Auth: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Conta criada sem retorno de usuário no Auth.");
    }

    return {
      id: data.user.id,
      email: data.user.email ?? input.email,
    };
  }

  async atualizarEmail(input: { id: string; email: string }) {
    const supabase = criarClienteSupabaseAdmin();

    const { error } = await supabase.auth.admin.updateUserById(input.id, {
      email: input.email,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Erro ao atualizar e-mail no Auth: ${error.message}`);
    }
  }

  async buscarConta(id: string): Promise<{ id: string; email: string | null }> {
    const supabase = criarClienteSupabaseAdmin();

    const { data, error } = await supabase.auth.admin.getUserById(id);

    if (error) {
      throw new Error(`Erro ao buscar conta no Auth: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Usuário não encontrado no Auth.");
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  }

  async removerConta(id: string): Promise<void> {
    const supabase = criarClienteSupabaseAdmin();

    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      throw new Error(`Erro ao remover conta do Auth: ${error.message}`);
    }
  }
}