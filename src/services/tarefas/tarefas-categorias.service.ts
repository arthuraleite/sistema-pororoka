import type { SupabaseClient } from "@supabase/supabase-js";

import { TarefasCategoriasRepository } from "@/repositories/tarefas/tarefas-categorias.repository";
import type {
  CategoriaTarefa,
  CriarCategoriaTarefaInput,
  EditarCategoriaTarefaInput,
  UUID,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

export class TarefasCategoriasService {
  private readonly categoriasRepository: TarefasCategoriasRepository;

  constructor(private readonly supabase: ClienteSupabase) {
    this.categoriasRepository = new TarefasCategoriasRepository(supabase);
  }

  async listar(params?: {
    equipeId?: UUID;
    ativo?: boolean;
  }): Promise<CategoriaTarefa[]> {
    return this.categoriasRepository.listar(params);
  }

  async buscarPorId(id: UUID): Promise<CategoriaTarefa | null> {
    return this.categoriasRepository.buscarPorId(id);
  }

  async criar(params: {
    input: CriarCategoriaTarefaInput;
    usuarioId: UUID;
  }): Promise<CategoriaTarefa> {
    const { input, usuarioId } = params;

    return this.categoriasRepository.criar(input, usuarioId);
  }

  async editar(params: {
    input: EditarCategoriaTarefaInput;
    usuarioId: UUID;
  }): Promise<CategoriaTarefa> {
    const { input, usuarioId } = params;

    const categoria = await this.categoriasRepository.buscarPorId(input.id);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    return this.categoriasRepository.editar(input, usuarioId);
  }

  async desativar(params: {
    id: UUID;
    usuarioId: UUID;
  }): Promise<CategoriaTarefa> {
    const { id, usuarioId } = params;

    const categoria = await this.categoriasRepository.buscarPorId(id);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    return this.categoriasRepository.desativar(id, usuarioId);
  }

  async validarCategoriaParaEquipe(params: {
    categoriaId: UUID;
    equipeId: UUID;
    permitirInativa?: boolean;
  }): Promise<CategoriaTarefa> {
    const { categoriaId, equipeId, permitirInativa = false } = params;

    const categoria = await this.categoriasRepository.buscarPorId(categoriaId);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    if (categoria.equipeId !== equipeId) {
      throw new Error("A categoria não pertence à equipe da tarefa.");
    }

    if (!permitirInativa && !categoria.ativo) {
      throw new Error("A categoria está desativada para novas seleções.");
    }

    return categoria;
  }
}