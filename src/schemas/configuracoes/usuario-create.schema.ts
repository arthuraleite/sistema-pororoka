import { z } from "zod";

const perfis = [
  "admin_supremo",
  "coordenador_geral",
  "gestor_financeiro",
  "coordenador_equipe",
  "assistente",
  "membro",
  "analista_financeiro",
] as const;

export const usuarioCreateSchema = z.object({
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
  perfil: z.enum(perfis),
  equipeId: z.string().uuid("Equipe inválida."),
});

export type UsuarioCreateSchemaInput = z.infer<typeof usuarioCreateSchema>;