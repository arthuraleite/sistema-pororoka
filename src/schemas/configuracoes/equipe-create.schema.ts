import { z } from "zod";

export const equipeCreateSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome da equipe deve ter pelo menos 2 caracteres.")
    .max(120, "O nome da equipe deve ter no máximo 120 caracteres."),
  descricao: z
    .string()
    .trim()
    .max(500, "A descrição deve ter no máximo 500 caracteres.")
    .nullable()
    .optional()
    .transform((value) => {
      if (value === undefined || value === "") return null;
      return value;
    }),
});

export type EquipeCreateSchemaInput = z.infer<typeof equipeCreateSchema>;