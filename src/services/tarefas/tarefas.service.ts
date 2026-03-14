import type { SupabaseClient } from "@supabase/supabase-js";

import { TarefasRepository } from "@/repositories/tarefas/tarefas.repository";
import type {
  CriarTarefaInput,
  EditarTarefaInput,
  PerfilSistema,
  ReabrirTarefaInput,
  StatusTarefa,
  Tarefa,
  TarefaDetalhe,
  TarefasFiltros,
  TarefasPaginadas,
} from "@/types/tarefas/tarefas.types";

type ClienteSupabase = SupabaseClient;

type ContextoUsuarioTarefas = {
  usuarioId: string;
  perfil: PerfilSistema;
  equipeId: string | null;
};

type ListarTarefasParams = {
  filtros?: TarefasFiltros;
  pagina?: number;
  limite?: number;
  contextoUsuario?: ContextoUsuarioTarefas;
};

type ExcluirInput = {
  id: string;
};

type MoverStatusInput = {
  id: string;
  novoStatus: StatusTarefa;
};

function podeVerTudo(perfil: PerfilSistema) {
  return perfil === "admin_supremo" || perfil === "coordenador_geral";
}

function podeVerObjetivosGlobais(perfil: PerfilSistema) {
  return perfil === "admin_supremo" || perfil === "coordenador_geral";
}

function podeCriarObjetivoGlobal(perfil: PerfilSistema) {
  return perfil === "admin_supremo" || perfil === "coordenador_geral";
}

function podeCriarObjetivoEquipe(perfil: PerfilSistema) {
  return (
    perfil === "admin_supremo" ||
    perfil === "coordenador_geral" ||
    perfil === "coordenador_equipe" ||
    perfil === "assistente" ||
    perfil === "gestor_financeiro"
  );
}

function podeVerObjetivoEquipe(perfil: PerfilSistema) {
  return (
    perfil === "admin_supremo" ||
    perfil === "coordenador_geral" ||
    perfil === "coordenador_equipe" ||
    perfil === "assistente" ||
    perfil === "gestor_financeiro"
  );
}

export class TarefasService {
  private readonly repository: TarefasRepository;

  constructor(private readonly supabase: ClienteSupabase) {
    this.repository = new TarefasRepository(supabase);
  }

  async listar(params?: ListarTarefasParams): Promise<TarefasPaginadas<Tarefa>> {
    const contexto = params?.contextoUsuario;

    const data = await this.repository.listar({
      filtros: params?.filtros,
      pagina: params?.pagina,
      limite: params?.limite,
    });

    if (!contexto) {
      return data;
    }

    const itensFiltrados = data.itens.filter((item) => {
      if (podeVerTudo(contexto.perfil)) {
        return true;
      }

      if (item.tipo === "pai") {
        if (item.escopoObjetivo === "global") {
          return podeVerObjetivosGlobais(contexto.perfil);
        }

        if (item.escopoObjetivo === "equipe") {
          return (
            podeVerObjetivoEquipe(contexto.perfil) &&
            item.equipeId !== null &&
            contexto.equipeId !== null &&
            item.equipeId === contexto.equipeId
          );
        }

        return false;
      }

      if (!contexto.equipeId) {
        return false;
      }

      return item.equipeId === contexto.equipeId;
    });

    return {
      itens: itensFiltrados,
      total: itensFiltrados.length,
      pagina: data.pagina,
      limite: data.limite,
      totalPaginas: Math.ceil(itensFiltrados.length / data.limite),
    };
  }

  async buscarPorId(
    id: string,
    contextoUsuario?: ContextoUsuarioTarefas,
  ): Promise<TarefaDetalhe | null> {
    const tarefa = await this.repository.buscarPorId(id);

    if (!tarefa) {
      return null;
    }

    if (!contextoUsuario) {
      return tarefa;
    }

    if (podeVerTudo(contextoUsuario.perfil)) {
      return tarefa;
    }

    if (tarefa.tipo === "pai") {
      if (tarefa.escopoObjetivo === "global") {
        return podeVerObjetivosGlobais(contextoUsuario.perfil) ? tarefa : null;
      }

      if (tarefa.escopoObjetivo === "equipe") {
        return podeVerObjetivoEquipe(contextoUsuario.perfil) &&
          tarefa.equipeId !== null &&
          contextoUsuario.equipeId !== null &&
          tarefa.equipeId === contextoUsuario.equipeId
          ? tarefa
          : null;
      }

      return null;
    }

    if (!contextoUsuario.equipeId) {
      return null;
    }

    return tarefa.equipeId === contextoUsuario.equipeId ? tarefa : null;
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

    const { data: usuarioAtual, error: usuarioError } = await this.supabase
      .from("usuarios")
      .select("id, perfil, equipe_id")
      .eq("auth_user_id", usuarioId)
      .maybeSingle();

    if (usuarioError || !usuarioAtual) {
      throw new Error("Não foi possível carregar o contexto do usuário.");
    }

    if (!input.responsavelIds?.length) {
      throw new Error("A tarefa precisa ter ao menos um responsável.");
    }

    if ((input.links ?? []).length > 5) {
      throw new Error("A tarefa pode ter no máximo 5 links.");
    }

    if (input.tipo === "pai") {
      if (input.escopoObjetivo === "global") {
        if (!podeCriarObjetivoGlobal(usuarioAtual.perfil)) {
          throw new Error("Você não tem permissão para criar objetivo global.");
        }
      }

      if (input.escopoObjetivo === "equipe") {
        if (!podeCriarObjetivoEquipe(usuarioAtual.perfil)) {
          throw new Error("Você não tem permissão para criar objetivo de equipe.");
        }

        if (!input.equipeId) {
          throw new Error("Objetivo de equipe precisa de uma equipe vinculada.");
        }

        if (
          !podeVerTudo(usuarioAtual.perfil) &&
          usuarioAtual.equipe_id !== input.equipeId
        ) {
          throw new Error(
            "Você só pode criar objetivo de equipe para sua própria equipe.",
          );
        }
      }
    } else {
      if (!input.equipeId) {
        throw new Error("Tarefas operacionais precisam de equipe.");
      }

      if (
        !podeVerTudo(usuarioAtual.perfil) &&
        usuarioAtual.equipe_id !== input.equipeId
      ) {
        throw new Error(
          "Você só pode criar tarefas operacionais da sua própria equipe.",
        );
      }
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
            criado_por_id: usuarioAtual.id,
            atualizado_por_id: usuarioAtual.id,
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
            criado_por_id: usuarioAtual.id,
            atualizado_por_id: usuarioAtual.id,
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

    const responsaveisPayload = input.responsavelIds.map(
      (usuarioResponsavelId) => ({
        tarefa_id: tarefaId,
        usuario_id: usuarioResponsavelId,
        atribuido_por_id: usuarioAtual.id,
      }),
    );

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
        criado_por_id: usuarioAtual.id,
      }));

      const { error: linksError } = await this.supabase
        .from("tarefas_links")
        .insert(linksPayload);

      if (linksError) {
        throw new Error(`Erro ao salvar links: ${linksError.message}`);
      }
    }

    const detalhe = await this.buscarPorId(tarefaId, {
      usuarioId: usuarioAtual.id,
      perfil: usuarioAtual.perfil,
      equipeId: usuarioAtual.equipe_id,
    });

    if (!detalhe) {
      throw new Error("Tarefa criada, mas não foi possível recarregar o detalhe.");
    }

    return detalhe;
  }

  async editar(input: EditarTarefaInput): Promise<TarefaDetalhe> {
    const usuarioId = await this.buscarUsuarioAtualId();

    const { data: usuarioAtual, error: usuarioError } = await this.supabase
      .from("usuarios")
      .select("id, perfil, equipe_id")
      .eq("auth_user_id", usuarioId)
      .maybeSingle();

    if (usuarioError || !usuarioAtual) {
      throw new Error("Não foi possível carregar o contexto do usuário.");
    }

    const tarefaAtual = await this.buscarPorId(input.id, {
      usuarioId: usuarioAtual.id,
      perfil: usuarioAtual.perfil,
      equipeId: usuarioAtual.equipe_id,
    });

    if (!tarefaAtual) {
      throw new Error("Tarefa não encontrada ou sem permissão de acesso.");
    }

    if (!input.responsavelIds?.length) {
      throw new Error("A tarefa precisa ter ao menos um responsável.");
    }

    if ((input.links ?? []).length > 5) {
      throw new Error("A tarefa pode ter no máximo 5 links.");
    }

    if (input.tipo === "pai") {
      if (input.escopoObjetivo === "global") {
        if (!podeCriarObjetivoGlobal(usuarioAtual.perfil)) {
          throw new Error("Você não tem permissão para editar objetivo global.");
        }
      }

      if (input.escopoObjetivo === "equipe") {
        if (!podeCriarObjetivoEquipe(usuarioAtual.perfil)) {
          throw new Error("Você não tem permissão para editar objetivo de equipe.");
        }

        if (!input.equipeId) {
          throw new Error("Objetivo de equipe precisa de uma equipe vinculada.");
        }

        if (
          !podeVerTudo(usuarioAtual.perfil) &&
          usuarioAtual.equipe_id !== input.equipeId
        ) {
          throw new Error(
            "Você só pode editar objetivo de equipe da sua própria equipe.",
          );
        }
      }
    } else {
      if (
        !podeVerTudo(usuarioAtual.perfil) &&
        tarefaAtual.equipeId !== usuarioAtual.equipe_id
      ) {
        throw new Error(
          "Você só pode editar tarefas operacionais da sua própria equipe.",
        );
      }
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
            atualizado_por_id: usuarioAtual.id,
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
            atualizado_por_id: usuarioAtual.id,
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

    const responsaveisPayload = input.responsavelIds.map(
      (usuarioResponsavelId) => ({
        tarefa_id: input.id,
        usuario_id: usuarioResponsavelId,
        atribuido_por_id: usuarioAtual.id,
      }),
    );

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
        criado_por_id: usuarioAtual.id,
      }));

      const { error: insertLinksError } = await this.supabase
        .from("tarefas_links")
        .insert(linksPayload);

      if (insertLinksError) {
        throw new Error(`Erro ao salvar links: ${insertLinksError.message}`);
      }
    }

    const detalhe = await this.buscarPorId(input.id, {
      usuarioId: usuarioAtual.id,
      perfil: usuarioAtual.perfil,
      equipeId: usuarioAtual.equipe_id,
    });

    if (!detalhe) {
      throw new Error("Tarefa atualizada, mas não foi possível recarregar o detalhe.");
    }

    return detalhe;
  }

  async excluir(
    input: ExcluirInput,
    contextoUsuario?: ContextoUsuarioTarefas,
  ): Promise<void> {
    if (contextoUsuario) {
      const tarefa = await this.buscarPorId(input.id, contextoUsuario);

      if (!tarefa) {
        throw new Error("Tarefa não encontrada ou sem permissão de acesso.");
      }
    }

    const { error } = await this.supabase
      .from("tarefas")
      .delete()
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message || "Não foi possível excluir a tarefa.");
    }
  }

  async moverStatus(
    input: MoverStatusInput,
    contextoUsuario?: ContextoUsuarioTarefas,
  ): Promise<TarefaDetalhe> {
    if (contextoUsuario) {
      const tarefa = await this.buscarPorId(input.id, contextoUsuario);

      if (!tarefa) {
        throw new Error("Tarefa não encontrada ou sem permissão de acesso.");
      }
    }

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

    const detalhe = await this.buscarPorId(input.id, contextoUsuario);

    if (!detalhe) {
      throw new Error("Status atualizado, mas não foi possível recarregar a tarefa.");
    }

    return detalhe;
  }

  async reabrir(
    input: ReabrirTarefaInput,
    contextoUsuario?: ContextoUsuarioTarefas,
  ): Promise<TarefaDetalhe> {
    if (contextoUsuario) {
      const tarefa = await this.buscarPorId(input.id, contextoUsuario);

      if (!tarefa) {
        throw new Error("Tarefa não encontrada ou sem permissão de acesso.");
      }
    }

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

    const detalhe = await this.buscarPorId(input.id, contextoUsuario);

    if (!detalhe) {
      throw new Error("Tarefa reaberta, mas não foi possível recarregar o detalhe.");
    }

    return detalhe;
  }
}