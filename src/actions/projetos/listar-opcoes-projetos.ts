"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import {
  listarCoordenadoresProjetoService,
  listarFinanciadoresProjetoService,
  listarRubricasGlobaisProjetoService,
} from "@/services/projetos/projetos.service";
import type {
  OpcoesProjetos,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export async function listarOpcoesProjetos(): Promise<
  ResultadoOperacaoProjeto<OpcoesProjetos>
> {
  try {
    const supabase = await criarClienteSupabaseServidor();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        sucesso: false,
        mensagem: "Sessão inválida. Faça login novamente.",
      };
    }

    const [coordenadores, financiadores, rubricasGlobais] = await Promise.all([
      listarCoordenadoresProjetoService(user.id),
      listarFinanciadoresProjetoService(user.id),
      listarRubricasGlobaisProjetoService(user.id),
    ]);

    return {
      sucesso: true,
      mensagem: "Opções carregadas com sucesso.",
      data: {
        coordenadores,
        financiadores,
        rubricasGlobais: rubricasGlobais.map((item) => ({
          id: item.id,
          nome: item.nome,
          descricao: null,
        })),
      },
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem:
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as opções de projetos.",
    };
  }
}