"use server";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { criarTarefaPaiSchema } from "@/schemas/tarefas/tarefa-pai.schema";
import {
  criarTarefaFilhaSchema,
  criarTarefaOperacionalSchema,
  criarTarefaOrfaSchema,
} from "@/schemas/tarefas/tarefa-operacional.schema";
import { TarefasService } from "@/services/tarefas/tarefas.service";
import { z } from "zod";
import type {
  CriarTarefaInput,
  PrioridadeTarefa,
  ResultadoOperacaoTarefa,
  TarefaDetalhe,
} from "@/types/tarefas/tarefas.types";

type CriarTarefaActionInput = unknown;

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

export async function criarTarefa(
  input: CriarTarefaActionInput,
): Promise<ResultadoOperacaoTarefa<TarefaDetalhe>> {
  try {
    const tipo =
      typeof input === "object" && input !== null && "tipo" in input
        ? (input as { tipo?: string }).tipo
        : undefined;

    let parsed:
      | ReturnType<typeof criarTarefaPaiSchema.parse>
      | ReturnType<typeof criarTarefaFilhaSchema.parse>
      | ReturnType<typeof criarTarefaOrfaSchema.parse>
      | ReturnType<typeof criarTarefaOperacionalSchema.parse>;

    if (tipo === "pai") {
      parsed = criarTarefaPaiSchema.parse(input);
    } else if (tipo === "filha") {
      parsed = criarTarefaFilhaSchema.parse(input);
    } else if (tipo === "orfa") {
      parsed = criarTarefaOrfaSchema.parse(input);
    } else {
      parsed = criarTarefaOperacionalSchema.parse(input);
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

    let payload: CriarTarefaInput;

    if (parsed.tipo === "pai") {
      payload = {
        tipo: "pai",
        escopoObjetivo: parsed.escopoObjetivo,
        equipeId: parsed.equipeId ?? null,
        titulo: parsed.titulo,
        descricao: parsed.descricao ?? null,
        projetoId: parsed.projetoId ?? null,
        prioridade,
        status: "a_fazer",
        dataEntrega: parsed.dataEntrega,
        horaEntrega: parsed.horaEntrega ?? null,
        responsavelIds: parsed.responsavelIds,
        links: parsed.links,
      };
    } else {
      payload = {
        tipo: parsed.tipo,
        escopoObjetivo: null,
        titulo: parsed.titulo,
        descricao: parsed.descricao ?? null,
        tarefaPaiId: parsed.tipo === "filha" ? parsed.tarefaPaiId ?? null : null,
        equipeId: parsed.equipeId ?? null,
        categoriaId: parsed.categoriaId ?? null,
        prioridade,
        dataEntrega: parsed.dataEntrega,
        horaEntrega: parsed.horaEntrega ?? null,
        responsavelIds: parsed.responsavelIds,
        links: parsed.links,
      };
    }

    const data = await service.criar(payload);

    return {
      sucesso: true,
      mensagem: "Tarefa criada com sucesso.",
      data,
    };
  } catch (error) {
    console.error("Erro bruto em criarTarefa:", error);

    let mensagem = "Erro ao criar tarefa.";

    if (error instanceof z.ZodError) {
      mensagem = `Dados inválidos para criar tarefa: ${JSON.stringify(
        error.flatten().fieldErrors,
      )}`;
    } else if (error instanceof Error && error.message) {
      mensagem = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      mensagem = (error as { message: string }).message;
    } else {
      try {
        mensagem = JSON.stringify(error, null, 2);
      } catch {
        mensagem = "Erro ao criar tarefa.";
      }
    }

    return {
      sucesso: false,
      mensagem,
    };
  }
}