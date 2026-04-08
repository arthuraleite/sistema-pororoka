import { z } from "zod";

import {
  STATUS_PROJETO,
  TIPOS_PROJETO,
} from "@/types/projetos/projetos.types";

const linkSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título do link."),
  url: z.string().trim().min(1, "Informe a URL do link."),
});

const rubricaSchema = z.object({
  rubrica_global_id: z.string().uuid("Rubrica global inválida."),
  limite_teto_gasto: 
    z.coerce.number().refine((valor) => Number.isFinite(valor), {
            message: "Informe um valor válido.",
    })
    .nonnegative("O teto da rubrica não pode ser negativo."),
});

export const projetoSchema = z
  .object({
    tipo: z.enum(TIPOS_PROJETO, {
      message: "Selecione o tipo do projeto.",
    }),
    nome: z.string().trim().min(1, "Informe o nome do projeto."),
    sigla: z.string().trim().min(1, "Informe a sigla do projeto."),
    resumo: z.string().trim().nullable(),
    coordenador_id: z.string().uuid("Selecione um coordenador válido."),
    data_inicio: z.string().trim().min(1, "Informe a data de início."),
    data_fim: z.string().trim().nullable(),
    financiador_id: z.string().uuid().nullable(),
    orcamento_total: z.number().nullable(),
    status: z.enum(STATUS_PROJETO, {
      message: "Selecione o status do projeto.",
    }),
    observacoes: z.string().trim().nullable(),
    links: z
      .array(linkSchema)
      .max(10, "O projeto pode ter no máximo 10 links."),
    rubricas: z.array(rubricaSchema),
  })
  .superRefine((data, ctx) => {
    if (data.data_fim && data.data_fim < data.data_inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["data_fim"],
        message: "A data final não pode ser anterior à data inicial.",
      });
    }

    if (data.tipo === "interno") {
      if (data.financiador_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["financiador_id"],
          message: "Projeto interno não deve ter financiador.",
        });
      }

      if (data.orcamento_total !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["orcamento_total"],
          message: "Projeto interno não deve ter orçamento total.",
        });
      }

      if (data.rubricas.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rubricas"],
          message: "Projeto interno não deve ter rubricas nesta fase.",
        });
      }
    }

    if (data.tipo === "financiado") {
      if (!data.financiador_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["financiador_id"],
          message: "Selecione o financiador do projeto.",
        });
      }

      if (data.orcamento_total === null || data.orcamento_total <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["orcamento_total"],
          message: "Informe um orçamento total maior que zero.",
        });
      }

      if (data.rubricas.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rubricas"],
          message: "Projeto financiado deve ter ao menos uma rubrica.",
        });
      }

      const somaRubricas = data.rubricas.reduce(
        (acc, item) => acc + item.limite_teto_gasto,
        0,
      );

      if (
        data.orcamento_total !== null &&
        Number(somaRubricas.toFixed(2)) !== Number(data.orcamento_total.toFixed(2))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rubricas"],
          message:
            "A soma dos tetos das rubricas deve ser exatamente igual ao orçamento total.",
        });
      }
    }
  });

export const criarFinanciadorSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do financiador."),
});

export type ProjetoSchemaInput = z.infer<typeof projetoSchema>;
export type CriarFinanciadorSchemaInput = z.infer<
  typeof criarFinanciadorSchema
>;