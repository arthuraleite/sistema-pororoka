"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { editarTarefaPaiSchema } from "@/schemas/tarefas/tarefa-pai.schema";
import {
  editarTarefaFilhaSchema,
  editarTarefaOperacionalSchema,
  editarTarefaOrfaSchema,
} from "@/schemas/tarefas/tarefa-operacional.schema";
import { TarefasService } from "@/services/tarefas/tarefas.service";
import type {
  EditarTarefaInput,
  PrioridadeTarefa,
  ResultadoOperacaoTarefa,
  TarefaDetalhe,
} from "@/types/tarefas/tarefas.types";

type EditarTarefaActionInput = unknown;

function normalizarPrioridade(
  valor: unknown,
): PrioridadeTarefa | null | undefined {
  if (
    valor === "urgente" ||
    valor === "alta" ||
    valor === "media" ||
    valor === "baixa"
  ) {
    return valor;
  }

  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  return undefined;
}

export async function editarTarefa(
  input: EditarTarefaActionInput,
): Promise<ResultadoOperacaoTarefa<TarefaDetalhe>> {
  try {
    const tipo =
      typeof input === "object" && input !== null && "tipo" in input
        ? (input as { tipo?: string }).tipo
        : undefined;

    let parsed:
      | ReturnType<typeof editarTarefaPaiSchema.parse>
      | ReturnType<typeof editarTarefaFilhaSchema.parse>
      | ReturnType<typeof editarTarefaOrfaSchema.parse>
      | ReturnType<typeof editarTarefaOperacionalSchema.parse>;

    if (tipo === "pai") {
      parsed = editarTarefaPaiSchema.parse(input);
    } else if (tipo === "filha") {
      parsed = editarTarefaFilhaSchema.parse(input);
    } else if (tipo === "orfa") {
      parsed = editarTarefaOrfaSchema.parse(input);
    } else {
      parsed = editarTarefaOperacionalSchema.parse(input);
    }

    const supabase = await criarClienteSupabaseServidor();
    const service = new TarefasService(supabase);

    const prioridade = normalizarPrioridade(parsed.prioridade);

    if (prioridade === undefined) {
      return {
        sucesso: false,
        mensagem: "Prioridade inválida.",
      };
    }

    let payload: EditarTarefaInput;

    if (parsed.tipo === "pai") {
      payload = {
        id: parsed.id,
        tipo: "pai",
        escopoObjetivo: parsed.escopoObjetivo,
        equipeId: parsed.equipeId ?? null,
        titulo: parsed.titulo,
        descricao: parsed.descricao ?? null,
        projetoId: parsed.projetoId ?? null,
        prioridade,
        status: parsed.status ?? "a_fazer",
        dataEntrega: parsed.dataEntrega,
        horaEntrega: parsed.horaEntrega ?? null,
        responsavelIds: parsed.responsavelIds,
        links: parsed.links,
      };
    } else if (parsed.tipo === "filha") {
      payload = {
        id: parsed.id,
        tipo: "filha",
        escopoObjetivo: null,
        titulo: parsed.titulo,
        descricao: parsed.descricao ?? null,
        tarefaPaiId:
          "tarefaPaiId" in parsed
            ? (parsed.tarefaPaiId as string | null | undefined) ?? null
            : null,
        equipeId:
          "equipeId" in parsed
            ? (parsed.equipeId as string | null | undefined) ?? null
            : null,
        categoriaId:
          "categoriaId" in parsed
            ? (parsed.categoriaId as string | null | undefined) ?? null
            : null,
        prioridade,
        status:
          "status" in parsed
            ? (parsed.status as
                | "a_fazer"
                | "em_andamento"
                | "atencao"
                | "em_atraso"
                | "em_pausa"
                | "concluida"
                | null
                | undefined) ?? "a_fazer"
            : "a_fazer",
        dataEntrega: parsed.dataEntrega,
        horaEntrega: parsed.horaEntrega ?? null,
        responsavelIds: parsed.responsavelIds,
        links: parsed.links,
      };
    } else {
      payload = {
        id: parsed.id,
        tipo: "orfa",
        escopoObjetivo: null,
        titulo: parsed.titulo,
        descricao: parsed.descricao ?? null,
        tarefaPaiId: null,
        equipeId:
          "equipeId" in parsed
            ? (parsed.equipeId as string | null | undefined) ?? null
            : null,
        categoriaId:
          "categoriaId" in parsed
            ? (parsed.categoriaId as string | null | undefined) ?? null
            : null,
        prioridade,
        status:
          "status" in parsed
            ? (parsed.status as
                | "a_fazer"
                | "em_andamento"
                | "atencao"
                | "em_atraso"
                | "em_pausa"
                | "concluida"
                | null
                | undefined) ?? "a_fazer"
            : "a_fazer",
        dataEntrega: parsed.dataEntrega,
        horaEntrega: parsed.horaEntrega ?? null,
        responsavelIds: parsed.responsavelIds,
        links: parsed.links,
      };
    }

    const data = await service.editar(payload);

    return {
      sucesso: true,
      mensagem: "Tarefa atualizada com sucesso.",
      data,
    };
  } catch (error) {
    console.error("Erro bruto em editarTarefa:", error);
    console.error(
      "Erro serializado em editarTarefa:",
      JSON.stringify(error, null, 2),
    );

    const mensagem =
      typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);

    return {
      sucesso: false,
      mensagem: `Erro ao editar tarefa: ${mensagem}`,
    };
  }
}