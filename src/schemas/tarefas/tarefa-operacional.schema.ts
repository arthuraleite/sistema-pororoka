import { z } from "zod";

import {
  dataISODateSchema,
  horaSchema,
  listaUUIDsMinUmSchema,
  prioridadeTarefaSchema,
  statusTarefaSchema,
  textoOpcionalSchema,
  textoObrigatorioSchema,
  urlSchema,
  uuidSchema,
} from "@/schemas/tarefas/tarefa-status.schema";

const linkTarefaSchema = z.object({
  id: uuidSchema.optional(),
  url: urlSchema,
  texto: textoOpcionalSchema
    .transform((value) => (typeof value === "string" ? value : null))
    .pipe(
      z
        .string()
        .max(150, "O texto do link deve ter no máximo 150 caracteres.")
        .nullable(),
    )
    .optional(),
});

const linksTarefaSchema = z
  .array(linkTarefaSchema)
  .max(5, "A tarefa pode ter no máximo 5 links.");

const baseTarefaOperacionalSchema = z.object({
  titulo: textoObrigatorioSchema.max(
    160,
    "O título deve ter no máximo 160 caracteres.",
  ),
  descricao: textoOpcionalSchema
    .transform((value) => (typeof value === "string" ? value : null))
    .pipe(
      z
        .string()
        .max(5000, "A descrição deve ter no máximo 5000 caracteres.")
        .nullable(),
    )
    .optional(),
  categoriaId: uuidSchema,
  prioridade: prioridadeTarefaSchema,
  dataEntrega: dataISODateSchema,
  horaEntrega: z
    .union([horaSchema, textoOpcionalSchema])
    .optional()
    .transform((value) => (typeof value === "string" ? value : null)),
  responsavelIds: listaUUIDsMinUmSchema,
  links: linksTarefaSchema.optional().default([]),
});

export const criarTarefaOrfaSchema = baseTarefaOperacionalSchema.extend({
  tipo: z.literal("orfa"),
  escopoObjetivo: z.null(),
  equipeId: uuidSchema,
});

export const criarTarefaFilhaSchema = baseTarefaOperacionalSchema.extend({
  tipo: z.literal("filha"),
  escopoObjetivo: z.null(),
  tarefaPaiId: uuidSchema,
  equipeId: uuidSchema,
});

export const criarTarefaOperacionalSchema = z.discriminatedUnion("tipo", [
  criarTarefaOrfaSchema,
  criarTarefaFilhaSchema,
]);

const baseEditarTarefaOperacionalSchema = z.object({
  id: uuidSchema,
  titulo: textoObrigatorioSchema.max(
    160,
    "O título deve ter no máximo 160 caracteres.",
  ),
  descricao: textoOpcionalSchema
    .transform((value) => (typeof value === "string" ? value : null))
    .pipe(
      z
        .string()
        .max(5000, "A descrição deve ter no máximo 5000 caracteres.")
        .nullable(),
    )
    .optional(),
  categoriaId: uuidSchema,
  prioridade: prioridadeTarefaSchema,
  status: statusTarefaSchema,
  dataEntrega: dataISODateSchema,
  horaEntrega: z
    .union([horaSchema, textoOpcionalSchema])
    .optional()
    .transform((value) => (typeof value === "string" ? value : null)),
  dataConclusao: z
    .union([
      z.string().datetime("Data de conclusão inválida."),
      textoOpcionalSchema,
    ])
    .optional()
    .transform((value) => (typeof value === "string" ? value : null)),
  responsavelIds: listaUUIDsMinUmSchema,
  links: linksTarefaSchema.optional().default([]),
});

export const editarTarefaOrfaSchema = baseEditarTarefaOperacionalSchema.extend({
  tipo: z.literal("orfa"),
  escopoObjetivo: z.null(),
});

export const editarTarefaFilhaSchema = baseEditarTarefaOperacionalSchema.extend({
  tipo: z.literal("filha"),
  escopoObjetivo: z.null(),
});

export const editarTarefaOperacionalSchema = z.discriminatedUnion("tipo", [
  editarTarefaOrfaSchema,
  editarTarefaFilhaSchema,
]);

export const moverTarefaStatusSchema = z.object({
  id: uuidSchema,
  novoStatus: z.enum([
    "a_fazer",
    "em_andamento",
    "atencao",
    "em_pausa",
    "concluida",
  ]),
});

export const reabrirTarefaSchema = z.object({
  id: uuidSchema,
  novoStatus: z.enum(["a_fazer", "em_andamento", "atencao", "em_pausa"]),
});

export const gerirResponsaveisTarefaSchema = z.object({
  tarefaId: uuidSchema,
  responsavelIds: listaUUIDsMinUmSchema,
});

export const excluirTarefaSchema = z.object({
  id: uuidSchema,
});