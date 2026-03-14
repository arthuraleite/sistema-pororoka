import { z } from "zod";

export const usuarioEditSchema = z.object({
  id: z.string().uuid("Identificador de usuário inválido."),
  nome: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(150, "O nome deve ter no máximo 150 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido."),
  equipeId: z.string().uuid("Equipe inválida."),
});

export type UsuarioEditSchemaInput = z.infer<typeof usuarioEditSchema>;