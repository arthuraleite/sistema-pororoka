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

export const usuarioPerfilSchema = z.object({
  id: z.string().uuid("Identificador de usuário inválido."),
  novoPerfil: z.enum(perfis),
});

export type UsuarioPerfilSchemaInput = z.infer<typeof usuarioPerfilSchema>;