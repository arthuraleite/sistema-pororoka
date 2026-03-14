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

const escopoObjetivoSchema = z.enum(["global", "equipe"]);

const linkTarefaPaiSchema = z.object({
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

const linksTarefaPaiSchema = z
  .array(linkTarefaPaiSchema)
  .max(5, "A tarefa pode ter no máximo 5 links.");

const baseTarefaPaiSchema = z
  .object({
    tipo: z.literal("pai"),
    escopoObjetivo: escopoObjetivoSchema,
    equipeId: z
      .union([uuidSchema, textoOpcionalSchema])
      .optional()
      .transform((value) => (typeof value === "string" ? value : null)),
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
    projetoId: z
      .union([uuidSchema, textoOpcionalSchema])
      .optional()
      .transform((value) => (typeof value === "string" ? value : null)),
    prioridade: z
      .union([prioridadeTarefaSchema, textoOpcionalSchema])
      .optional()
      .transform((value) => (typeof value === "string" ? value : null)),
    status: statusTarefaSchema,
    dataEntrega: dataISODateSchema,
    horaEntrega: z
      .union([horaSchema, textoOpcionalSchema])
      .optional()
      .transform((value) => (typeof value === "string" ? value : null)),
    responsavelIds: listaUUIDsMinUmSchema,
    links: linksTarefaPaiSchema.optional().default([]),
  })
  .superRefine((values, ctx) => {
    if (values.escopoObjetivo === "global" && values.equipeId !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["equipeId"],
        message: "Objetivo global não deve possuir equipe vinculada.",
      });
    }

    if (values.escopoObjetivo === "equipe" && !values.equipeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["equipeId"],
        message: "Objetivo de equipe deve possuir uma equipe vinculada.",
      });
    }
  });

export const criarTarefaPaiSchema = baseTarefaPaiSchema;

export const editarTarefaPaiSchema = baseTarefaPaiSchema.extend({
  id: uuidSchema,
  dataConclusao: z
    .union([
      z.string().datetime("Data de conclusão inválida."),
      textoOpcionalSchema,
    ])
    .optional()
    .transform((value) => (typeof value === "string" ? value : null)),
});