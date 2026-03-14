import type { SupabaseClient } from "@supabase/supabase-js";

import { TarefasComentariosRepository } from "@/repositories/tarefas/tarefas-comentarios.repository";
import { TarefasRepository } from "@/repositories/tarefas/tarefas.repository";
import type {
  CriarComentarioTarefaInput,
  EditarComentarioTarefaInput,
  TarefaComentario,
  UUID,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

export class TarefasComentariosService {
  private readonly tarefasRepository: TarefasRepository;
  private readonly comentariosRepository: TarefasComentariosRepository;

  constructor(private readonly supabase: ClienteSupabase) {
    this.tarefasRepository = new TarefasRepository(supabase);
    this.comentariosRepository = new TarefasComentariosRepository(supabase);
  }

  async listarPorTarefa(tarefaId: UUID): Promise<TarefaComentario[]> {
    const tarefa = await this.tarefasRepository.buscarPorId(tarefaId);

    if (!tarefa) {
      throw new Error("Tarefa não encontrada.");
    }

    const comentarios = await this.comentariosRepository.listarPorTarefa(tarefaId);
    return this.organizarHierarquia(comentarios);
  }

  async criar(params: {
    input: CriarComentarioTarefaInput;
    autorId: UUID;
  }): Promise<TarefaComentario> {
    const { input, autorId } = params;

    const tarefa = await this.tarefasRepository.buscarPorId(input.tarefaId);

    if (!tarefa) {
      throw new Error("Tarefa não encontrada.");
    }

    if (input.comentarioPaiId) {
      const comentarioPai = await this.comentariosRepository.buscarPorId(
        input.comentarioPaiId,
      );

      if (!comentarioPai) {
        throw new Error("Comentário pai não encontrado.");
      }

      if (comentarioPai.tarefaId !== input.tarefaId) {
        throw new Error(
          "A resposta deve pertencer à mesma tarefa do comentário pai.",
        );
      }
    }

    return this.comentariosRepository.criar(input, autorId);
  }

  async editar(params: {
    input: EditarComentarioTarefaInput;
    autorId: UUID;
  }): Promise<TarefaComentario> {
    const { input, autorId } = params;

    const comentario = await this.comentariosRepository.buscarPorId(
      input.comentarioId,
    );

    if (!comentario) {
      throw new Error("Comentário não encontrado.");
    }

    if (comentario.autorId !== autorId) {
      throw new Error("Apenas o autor pode editar este comentário.");
    }

    return this.comentariosRepository.editar(input, autorId);
  }

  async excluir(params: {
    comentarioId: UUID;
    solicitante: UsuarioResumoTarefa;
  }): Promise<void> {
    const { comentarioId, solicitante } = params;

    const comentario = await this.comentariosRepository.buscarPorId(comentarioId);

    if (!comentario) {
      throw new Error("Comentário não encontrado.");
    }

    const podeExcluir =
      comentario.autorId === solicitante.id ||
      [
        "admin_supremo",
        "coordenador_geral",
        "gestor_financeiro",
        "coordenador_equipe",
        "assistente",
      ].includes(solicitante.perfil);

    if (!podeExcluir) {
      throw new Error("Você não tem permissão para excluir este comentário.");
    }

    await this.comentariosRepository.excluir(comentarioId);
  }

  private organizarHierarquia(
    comentarios: TarefaComentario[],
  ): TarefaComentario[] {
    const mapa = new Map<UUID, TarefaComentario>();
    const raiz: TarefaComentario[] = [];

    for (const comentario of comentarios) {
      mapa.set(comentario.id, {
        ...comentario,
        respostas: [],
      });
    }

    for (const comentario of mapa.values()) {
      if (comentario.comentarioPaiId) {
        const pai = mapa.get(comentario.comentarioPaiId);

        if (pai) {
          pai.respostas = [...(pai.respostas ?? []), comentario];
          continue;
        }
      }

      raiz.push(comentario);
    }

    return raiz;
  }
}