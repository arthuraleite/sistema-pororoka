import { z } from "zod";

const status = ["ativo", "inativo"] as const;

export const usuarioStatusSchema = z.object({
  id: z.string().uuid("Identificador de usuário inválido."),
  status: z.enum(status),
});

export type UsuarioStatusSchemaInput = z.infer<typeof usuarioStatusSchema>;