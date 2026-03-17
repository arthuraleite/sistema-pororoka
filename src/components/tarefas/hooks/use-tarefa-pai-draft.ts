"use client";

import { useCallback, useMemo, useState } from "react";

export type PrioridadeTarefa = "urgente" | "alta" | "media" | "baixa";
export type StatusTarefa =
  | "a_fazer"
  | "em_andamento"
  | "atencao"
  | "em_pausa"
  | "em_atraso"
  | "concluida";

export type FilhaDraft = {
  idLocal: string;
  titulo: string;
  descricao?: string | null;
  equipeId: string;
  categoriaId: string;
  prioridade: PrioridadeTarefa;
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: string[];
  status: StatusTarefa;
};

export type ComentarioDraft = {
  idLocal: string;
  conteudo: string;
  linkExterno?: string | null;
  comentarioPaiId?: string | null;
  criadoEm: string;
};

export type AtualizacaoDraftTipo =
  | "objetivo_iniciado"
  | "filha_adicionada"
  | "filha_editada"
  | "filha_removida"
  | "comentario_adicionado"
  | "comentario_editado"
  | "comentario_removido"
  | "campo_alterado";

export type AtualizacaoDraft = {
  idLocal: string;
  tipo: AtualizacaoDraftTipo;
  descricao: string;
  criadoEm: string;
};

type AtualizacaoInput = {
  tipo: AtualizacaoDraftTipo;
  descricao: string;
};

function gerarIdLocal(prefixo: string) {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function agoraIso() {
  return new Date().toISOString();
}

export function useTarefaPaiDraft() {
  const [filhas, setFilhas] = useState<FilhaDraft[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioDraft[]>([]);
  const [atualizacoes, setAtualizacoes] = useState<AtualizacaoDraft[]>([
    {
      idLocal: gerarIdLocal("upd"),
      tipo: "objetivo_iniciado",
      descricao: "Início da criação do objetivo.",
      criadoEm: agoraIso(),
    },
  ]);

  const registrarAtualizacao = useCallback((input: AtualizacaoInput) => {
    setAtualizacoes((estadoAtual) => [
      {
        idLocal: gerarIdLocal("upd"),
        tipo: input.tipo,
        descricao: input.descricao,
        criadoEm: agoraIso(),
      },
      ...estadoAtual,
    ]);
  }, []);

  const adicionarFilha = useCallback(
    (input: Omit<FilhaDraft, "idLocal">) => {
      const novaFilha: FilhaDraft = {
        ...input,
        idLocal: gerarIdLocal("filha"),
      };

      setFilhas((estadoAtual) => [...estadoAtual, novaFilha]);

      registrarAtualizacao({
        tipo: "filha_adicionada",
        descricao: `Tarefa filha "${novaFilha.titulo}" adicionada.`,
      });

      return novaFilha;
    },
    [registrarAtualizacao],
  );

  const editarFilha = useCallback(
    (idLocal: string, patch: Partial<Omit<FilhaDraft, "idLocal">>) => {
      let tituloFinal = "";

      setFilhas((estadoAtual) =>
        estadoAtual.map((item) => {
          if (item.idLocal !== idLocal) {
            return item;
          }

          const atualizado = { ...item, ...patch };
          tituloFinal = atualizado.titulo;
          return atualizado;
        }),
      );

      registrarAtualizacao({
        tipo: "filha_editada",
        descricao: tituloFinal
          ? `Tarefa filha "${tituloFinal}" atualizada.`
          : "Tarefa filha atualizada.",
      });
    },
    [registrarAtualizacao],
  );

  const removerFilha = useCallback(
    (idLocal: string) => {
      let tituloRemovido = "";

      setFilhas((estadoAtual) =>
        estadoAtual.filter((item) => {
          if (item.idLocal === idLocal) {
            tituloRemovido = item.titulo;
            return false;
          }

          return true;
        }),
      );

      registrarAtualizacao({
        tipo: "filha_removida",
        descricao: tituloRemovido
          ? `Tarefa filha "${tituloRemovido}" removida.`
          : "Tarefa filha removida.",
      });
    },
    [registrarAtualizacao],
  );

  const adicionarComentario = useCallback(
    (input: Omit<ComentarioDraft, "idLocal" | "criadoEm">) => {
      const novoComentario: ComentarioDraft = {
        ...input,
        idLocal: gerarIdLocal("coment"),
        criadoEm: agoraIso(),
      };

      setComentarios((estadoAtual) => [...estadoAtual, novoComentario]);

      registrarAtualizacao({
        tipo: "comentario_adicionado",
        descricao: "Comentário adicionado.",
      });

      return novoComentario;
    },
    [registrarAtualizacao],
  );

  const editarComentario = useCallback(
    (
      idLocal: string,
      patch: Partial<Omit<ComentarioDraft, "idLocal" | "criadoEm">>,
    ) => {
      setComentarios((estadoAtual) =>
        estadoAtual.map((item) =>
          item.idLocal === idLocal ? { ...item, ...patch } : item,
        ),
      );

      registrarAtualizacao({
        tipo: "comentario_editado",
        descricao: "Comentário atualizado.",
      });
    },
    [registrarAtualizacao],
  );

  const removerComentario = useCallback(
    (idLocal: string) => {
      setComentarios((estadoAtual) =>
        estadoAtual.filter((item) => item.idLocal !== idLocal),
      );

      registrarAtualizacao({
        tipo: "comentario_removido",
        descricao: "Comentário removido.",
      });
    },
    [registrarAtualizacao],
  );

  const registrarCampoAlterado = useCallback(
    (descricao: string) => {
      registrarAtualizacao({
        tipo: "campo_alterado",
        descricao,
      });
    },
    [registrarAtualizacao],
  );

  const reset = useCallback(() => {
    setFilhas([]);
    setComentarios([]);
    setAtualizacoes([
      {
        idLocal: gerarIdLocal("upd"),
        tipo: "objetivo_iniciado",
        descricao: "Início da criação do objetivo.",
        criadoEm: agoraIso(),
      },
    ]);
  }, []);

  const resumo = useMemo(
    () => ({
      totalFilhas: filhas.length,
      totalComentarios: comentarios.length,
      totalAtualizacoes: atualizacoes.length,
    }),
    [filhas.length, comentarios.length, atualizacoes.length],
  );

  return {
    filhas,
    comentarios,
    atualizacoes,
    resumo,
    adicionarFilha,
    editarFilha,
    removerFilha,
    adicionarComentario,
    editarComentario,
    removerComentario,
    registrarAtualizacao,
    registrarCampoAlterado,
    reset,
  };
}

export type TarefaFilhaDraft = FilhaDraft;
export type TarefaComentarioDraft = ComentarioDraft;