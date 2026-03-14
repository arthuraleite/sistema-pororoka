import type { SupabaseClient } from "@supabase/supabase-js";

import { TarefasRepository } from "@/repositories/tarefas/tarefas.repository";
import type {
  CriarTarefaInput,
  EditarTarefaInput,
  ReabrirTarefaInput,
  StatusTarefa,
  Tarefa,
  TarefaDetalhe,
  TarefasFiltros,
  TarefasPaginadas,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type ListarTarefasParams = {
  filtros?: TarefasFiltros;
  pagina?: number;
  limite?: number;
};

type ExcluirInput = {
  id: string;
};

type MoverStatusInput = {
  id: string;
  novoStatus: StatusTarefa;
};

export class TarefasService {
  private readonly repository: TarefasRepository;

  constructor(private readonly supabase: ClienteSupabase) {
    this.repository = new TarefasRepository(supabase);
  }

  async listar(params?: ListarTarefasParams): Promise<TarefasPaginadas<Tarefa>> {
    return this.repository.listar({
      filtros: params?.filtros,
      pagina: params?.pagina,
      limite: params?.limite,
    });
  }

  async buscarPorId(id: string): Promise<TarefaDetalhe | null> {
    return this.repository.buscarPorId(id);
  }

  private async buscarUsuarioAtualId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user?.id) {
      throw new Error("Não foi possível identificar o usuário autenticado.");
    }

    return data.user.id;
  }

  async criar(input: CriarTarefaInput): Promise<TarefaDetalhe> {
    const usuarioId = await this.buscarUsuarioAtualId();

    if (!input.responsavelIds?.length) {
      throw new Error("A tarefa precisa ter ao menos um responsável.");
    }

    if ((input.links ?? []).length > 5) {
      throw new Error("A tarefa pode ter no máximo 5 links.");
    }

    const payloadTarefa =
      input.tipo === "pai"
        ? {
            tipo: "pai" as const,
            escopo_objetivo: input.escopoObjetivo,
            titulo: input.titulo,
            descricao: input.descricao ?? null,
            tarefa_pai_id: null,
            equipe_id:
              input.escopoObjetivo === "equipe" ? input.equipeId ?? null : null,
            categoria_id: null,
            projeto_id: input.projetoId ?? null,
            prioridade: input.prioridade ?? null,
            status: input.status ?? "a_fazer",
            data_entrega: input.dataEntrega,
            hora_entrega: input.horaEntrega ?? null,
            criado_por_id: usuarioId,
            atualizado_por_id: usuarioId,
          }
        : {
            tipo: input.tipo,
            escopo_objetivo: null,
            titulo: input.titulo,
            descricao: input.descricao ?? null,
            tarefa_pai_id:
              input.tipo === "filha" ? input.tarefaPaiId ?? null : null,
            equipe_id: input.equipeId ?? null,
            categoria_id: input.categoriaId ?? null,
            projeto_id: null,
            prioridade: input.prioridade ?? null,
            status: input.status ?? "a_fazer",
            data_entrega: input.dataEntrega,
            hora_entrega: input.horaEntrega ?? null,
            criado_por_id: usuarioId,
            atualizado_por_id: usuarioId,
          };

    const tarefaId = crypto.randomUUID();

    const { error: tarefaError } = await this.supabase.from("tarefas").insert({
      id: tarefaId,
      ...payloadTarefa,
    });

    if (tarefaError) {
      throw new Error(
        tarefaError.message || "Não foi possível criar a tarefa.",
      );
    }

    const responsaveisPayload = input.responsavelIds.map((usuarioResponsavelId) => ({
      tarefa_id: tarefaId,
      usuario_id: usuarioResponsavelId,
      atribuido_por_id: usuarioId,
    }));

    const { error: responsaveisError } = await this.supabase
      .from("tarefas_responsaveis")
      .insert(responsaveisPayload);

    if (responsaveisError) {
      throw new Error(
        `Erro ao salvar responsáveis: ${responsaveisError.message}`,
      );
    }

    if (input.links?.length) {
      const linksPayload = input.links.map((link) => ({
        tarefa_id: tarefaId,
        url: link.url,
        texto: link.texto ?? null,
        criado_por_id: usuarioId,
      }));

      const { error: linksError } = await this.supabase
        .from("tarefas_links")
        .insert(linksPayload);

      if (linksError) {
        throw new Error(`Erro ao salvar links: ${linksError.message}`);
      }
    }

    const detalhe = await this.buscarPorId(tarefaId);

    if (!detalhe) {
      throw new Error("Tarefa criada, mas não foi possível recarregar o detalhe.");
    }

    return detalhe;
  }

  async editar(input: EditarTarefaInput): Promise<TarefaDetalhe> {
    const usuarioId = await this.buscarUsuarioAtualId();

    if (!input.responsavelIds?.length) {
      throw new Error("A tarefa precisa ter ao menos um responsável.");
    }

    if ((input.links ?? []).length > 5) {
      throw new Error("A tarefa pode ter no máximo 5 links.");
    }

    const payloadTarefa =
      input.tipo === "pai"
        ? {
            escopo_objetivo: input.escopoObjetivo,
            titulo: input.titulo,
            descricao: input.descricao ?? null,
            equipe_id:
              input.escopoObjetivo === "equipe" ? input.equipeId ?? null : null,
            projeto_id: input.projetoId ?? null,
            prioridade: input.prioridade ?? null,
            status: input.status ?? "a_fazer",
            data_entrega: input.dataEntrega,
            hora_entrega: input.horaEntrega ?? null,
            atualizado_por_id: usuarioId,
          }
        : {
            escopo_objetivo: null,
            titulo: input.titulo,
            descricao: input.descricao ?? null,
            tarefa_pai_id:
              input.tipo === "filha" ? input.tarefaPaiId ?? null : null,
            categoria_id: input.categoriaId ?? null,
            prioridade: input.prioridade ?? null,
            status: input.status ?? "a_fazer",
            data_entrega: input.dataEntrega,
            hora_entrega: input.horaEntrega ?? null,
            atualizado_por_id: usuarioId,
          };

    const { error: updateError } = await this.supabase
      .from("tarefas")
      .update(payloadTarefa)
      .eq("id", input.id);

    if (updateError) {
      throw new Error(
        updateError.message || "Não foi possível atualizar a tarefa.",
      );
    }

    const { error: deleteRespError } = await this.supabase
      .from("tarefas_responsaveis")
      .delete()
      .eq("tarefa_id", input.id);

    if (deleteRespError) {
      throw new Error(
        `Erro ao atualizar responsáveis: ${deleteRespError.message}`,
      );
    }

    const responsaveisPayload = input.responsavelIds.map((usuarioResponsavelId) => ({
      tarefa_id: input.id,
      usuario_id: usuarioResponsavelId,
      atribuido_por_id: usuarioId,
    }));

    const { error: insertRespError } = await this.supabase
      .from("tarefas_responsaveis")
      .insert(responsaveisPayload);

    if (insertRespError) {
      throw new Error(
        `Erro ao salvar responsáveis: ${insertRespError.message}`,
      );
    }

    const { error: deleteLinksError } = await this.supabase
      .from("tarefas_links")
      .delete()
      .eq("tarefa_id", input.id);

    if (deleteLinksError) {
      throw new Error(`Erro ao atualizar links: ${deleteLinksError.message}`);
    }

    if (input.links?.length) {
      const linksPayload = input.links.map((link) => ({
        tarefa_id: input.id,
        url: link.url,
        texto: link.texto ?? null,
        criado_por_id: usuarioId,
      }));

      const { error: insertLinksError } = await this.supabase
        .from("tarefas_links")
        .insert(linksPayload);

      if (insertLinksError) {
        throw new Error(`Erro ao salvar links: ${insertLinksError.message}`);
      }
    }

    const detalhe = await this.buscarPorId(input.id);

    if (!detalhe) {
      throw new Error("Tarefa atualizada, mas não foi possível recarregar o detalhe.");
    }

    return detalhe;
  }

  async excluir(input: ExcluirInput): Promise<void> {
    const { error } = await this.supabase.from("tarefas").delete().eq("id", input.id);

    if (error) {
      throw new Error(error.message || "Não foi possível excluir a tarefa.");
    }
  }

  async moverStatus(input: MoverStatusInput): Promise<TarefaDetalhe> {
    const usuarioId = await this.buscarUsuarioAtualId();

    const { error } = await this.supabase
      .from("tarefas")
      .update({
        status: input.novoStatus,
        atualizado_por_id: usuarioId,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(
        error.message || "Não foi possível atualizar o status da tarefa.",
      );
    }

    const detalhe = await this.buscarPorId(input.id);

    if (!detalhe) {
      throw new Error("Status atualizado, mas não foi possível recarregar a tarefa.");
    }

    return detalhe;
  }

  async reabrir(input: ReabrirTarefaInput): Promise<TarefaDetalhe> {
    const usuarioId = await this.buscarUsuarioAtualId();

    const { error } = await this.supabase
      .from("tarefas")
      .update({
        status: input.novoStatus,
        data_conclusao: null,
        atualizado_por_id: usuarioId,
      })
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message || "Não foi possível reabrir a tarefa.");
    }

    const detalhe = await this.buscarPorId(input.id);

    if (!detalhe) {
      throw new Error("Tarefa reaberta, mas não foi possível recarregar o detalhe.");
    }

    return detalhe;
  }
}