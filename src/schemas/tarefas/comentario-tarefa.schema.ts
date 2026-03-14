import { z } from "zod";

import {
  textoObrigatorioSchema,
  textoOpcionalSchema,
  urlSchema,
  uuidSchema,
} from "@/schemas/tarefas/tarefa-status.schema";

export const criarComentarioTarefaSchema = z.object({
  tarefaId: uuidSchema,
  comentarioPaiId: uuidSchema.nullable().optional(),
  conteudo: textoObrigatorioSchema.max(
    5000,
    "O comentário deve ter no máximo 5000 caracteres.",
  ),
  linkExterno: z
    .union([urlSchema, textoOpcionalSchema])
    .optional()
    .transform((value) => (typeof value === "string" ? value : null)),
});

export const editarComentarioTarefaSchema = z.object({
  comentarioId: uuidSchema,
  conteudo: textoObrigatorioSchema.max(
    5000,
    "O comentário deve ter no máximo 5000 caracteres.",
  ),
  linkExterno: z
    .union([urlSchema, textoOpcionalSchema])
    .optional()
    .transform((value) => (typeof value === "string" ? value : null)),
});

export const excluirComentarioTarefaSchema = z.object({
  comentarioId: uuidSchema,
});