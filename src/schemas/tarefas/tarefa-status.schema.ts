import { z } from "zod";

import {
  // ALERTAS_PRAZO_TAREFA,
  PRIORIDADES_TAREFA,
  STATUS_TAREFA,
  TIPOS_EVENTO_RESPONSAVEL_TAREFA,
  TIPOS_NOTIFICACAO_TAREFA,
  TIPOS_TAREFA,
} from "@/types/tarefas/tarefas.types";

export const tipoTarefaSchema = z.enum(TIPOS_TAREFA);

export const statusTarefaSchema = z.enum(STATUS_TAREFA);

export const prioridadeTarefaSchema = z.enum(PRIORIDADES_TAREFA);

export const tipoEventoResponsavelTarefaSchema = z.enum(
  TIPOS_EVENTO_RESPONSAVEL_TAREFA,
);

export const tipoNotificacaoTarefaSchema = z.enum(
  TIPOS_NOTIFICACAO_TAREFA,
);

export const alertaPrazoTarefaSchema = z.union([
  z.literal(1),
  z.literal(3),
  z.literal(7),
]);

export const uuidSchema = z
  .string()
  .uuid("Identificador inválido.");

export const dataISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato YYYY-MM-DD.");

export const horaSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida. Use o formato HH:mm.");

export const textoOpcionalSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const textoObrigatorioSchema = z
  .string()
  .trim()
  .min(1, "Este campo é obrigatório.");

export const urlSchema = z
  .string()
  .trim()
  .url("Informe uma URL válida.");

export const listaUUIDsMinUmSchema = z
  .array(uuidSchema)
  .min(1, "Selecione ao menos um responsável.");