import { z } from "zod";

import {
  textoOpcionalSchema,
  textoObrigatorioSchema,
  uuidSchema,
} from "@/schemas/tarefas/tarefa-status.schema";

export const criarCategoriaTarefaSchema = z.object({
  equipeId: uuidSchema,
  nome: textoObrigatorioSchema.max(
    120,
    "O nome da categoria deve ter no máximo 120 caracteres.",
  ),
  descricao: textoOpcionalSchema
    .transform((value) => (typeof value === "string" ? value : null))
    .pipe(
      z
        .string()
        .max(500, "A descrição deve ter no máximo 500 caracteres.")
        .nullable(),
    )
    .optional(),
});

export const editarCategoriaTarefaSchema = z.object({
  id: uuidSchema,
  nome: textoObrigatorioSchema.max(
    120,
    "O nome da categoria deve ter no máximo 120 caracteres.",
  ),
  descricao: textoOpcionalSchema
    .transform((value) => (typeof value === "string" ? value : null))
    .pipe(
      z
        .string()
        .max(500, "A descrição deve ter no máximo 500 caracteres.")
        .nullable(),
    )
    .optional(),
  ativo: z.boolean(),
});

export const desativarCategoriaTarefaSchema = z.object({
  id: uuidSchema,
});