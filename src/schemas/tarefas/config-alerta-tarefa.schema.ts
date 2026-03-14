import { z } from "zod";

import { alertaPrazoTarefaSchema } from "@/schemas/tarefas/tarefa-status.schema";

export const atualizarConfiguracaoAlertaTarefaSchema = z.object({
  alertaPrazo: alertaPrazoTarefaSchema,
});