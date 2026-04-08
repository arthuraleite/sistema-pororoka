"use client";

import { useMemo, useState } from "react";

import { ProjetoFormBase } from "@/components/projetos/projeto-form-base";
import { ProjetoModalShell } from "@/components/projetos/projeto-modal-shell";
import type {
  FinanciadorProjetoOption,
  ProjetoDetalhe,
  ProjetoFormData,
  UsuarioCoordenadorProjetoOption,
} from "@/types/projetos/projetos.types";

type RubricaGlobalOption = {
  id: string;
  nome: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit" | "view";
  projeto?: ProjetoDetalhe | null;
  coordenadores: UsuarioCoordenadorProjetoOption[];
  financiadores: FinanciadorProjetoOption[];
  rubricasGlobais: RubricaGlobalOption[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit?: (values: ProjetoFormData) => void | Promise<void>;
  onCriarFinanciador?: (nome: string) => Promise<FinanciadorProjetoOption | null>;
  onCriarRubricaGlobal?: (nome: string) => Promise<RubricaGlobalOption | null>;
  onAbrirTarefasProjeto?: (projetoId: string) => void;
};

function subtituloModal(mode: Props["mode"]) {
  if (mode === "create") {
    return "Cadastre um novo projeto com dados gerais, recursos, rubricas, links e objetivos em leitura resumida.";
  }

  if (mode === "edit") {
    return "Edite o projeto no mesmo modal base, preservando a visão consolidada das informações estruturais.";
  }

  return "Visualize o projeto no mesmo modal base usado para edição, sem criar uma experiência paralela.";
}

export function ProjetoModal({
  open,
  mode,
  projeto,
  coordenadores,
  financiadores,
  rubricasGlobais,
  submitting = false,
  onClose,
  onSubmit,
  onCriarFinanciador,
  onCriarRubricaGlobal,
  onAbrirTarefasProjeto,
}: Props) {
  const [tituloEmEdicao, setTituloEmEdicao] = useState("");
  const [formDirty, setFormDirty] = useState(false);

  const tituloCabecalho = useMemo(() => {
    if (tituloEmEdicao.trim()) return tituloEmEdicao.trim();

    if (mode === "create") return "Novo projeto";
    return projeto?.nome?.trim() || "Projeto";
  }, [mode, projeto, tituloEmEdicao]);

  const initialValues = useMemo(() => {
    if (!projeto) return undefined;

    return {
      id: projeto.id,
      tipo: projeto.tipo,
      nome: projeto.nome,
      sigla: projeto.sigla,
      resumo: projeto.resumo,
      coordenador_id: projeto.coordenador_id,
      data_inicio: projeto.data_inicio,
      data_fim: projeto.data_fim,
      financiador_id: projeto.financiador_id,
      orcamento_total: projeto.orcamento_total,
      observacoes: projeto.observacoes,
      links: projeto.links.map((item) => ({
        titulo: item.titulo,
        url: item.url,
      })),
      rubricas: projeto.rubricas.map((item) => ({
        rubrica_global_id: item.rubrica_global_id,
        limite_teto_gasto: item.limite_teto_gasto,
      })),
    };
  }, [projeto]);

  function handleClose() {
    if (mode !== "view" && formDirty) {
      const confirmar = window.confirm("Tem certeza que deseja sair sem salvar?");
      if (!confirmar) return;
    }

    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <ProjetoModalShell
      open={open}
      title={tituloCabecalho}
      subtitle={subtituloModal(mode)}
      onClose={handleClose}
      main={
        <div className="space-y-5">
          <div className="mx-auto w-full max-w-[1120px]">
            <ProjetoFormBase
              mode={mode}
              projetoId={projeto?.id ?? null}
              initialValues={initialValues}
              coordenadores={coordenadores}
              financiadores={financiadores}
              rubricasGlobais={rubricasGlobais}
              objetivos={projeto?.objetivos ?? []}
              onSubmit={onSubmit}
              onTituloChange={setTituloEmEdicao}
              onDirtyChange={setFormDirty}
              onCriarFinanciador={onCriarFinanciador}
              onCriarRubricaGlobal={onCriarRubricaGlobal}
              onAbrirTarefasProjeto={onAbrirTarefasProjeto}
              formId="form-projeto"
              hideInternalSubmit
            />
          </div>
        </div>
      }
      sidebar={
        <div className="space-y-4">
          <section
            className="overflow-hidden rounded-[var(--radius-2xl)] border"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-0)",
            }}
          >
            <div
              className="border-b px-4 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                Resumo rápido
              </h3>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div>
                <p className="detail-label text-xs uppercase tracking-[0.14em]">
                  Tipo
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto
                    ? projeto.tipo === "financiado"
                      ? "Financiado"
                      : "Interno"
                    : "—"}
                </p>
              </div>

              <div>
                <p className="detail-label text-xs uppercase tracking-[0.14em]">
                  Status
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto
                    ? projeto.status === "a_iniciar"
                      ? "A iniciar"
                      : projeto.status === "em_andamento"
                        ? "Em andamento"
                        : projeto.status === "finalizado"
                          ? "Finalizado"
                          : "Concluído"
                    : "—"}
                </p>
              </div>

              <div>
                <p className="detail-label text-xs uppercase tracking-[0.14em]">
                  Coordenador
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto?.coordenador_nome ?? "—"}
                </p>
              </div>

              <div>
                <p className="detail-label text-xs uppercase tracking-[0.14em]">
                  Financiador
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto?.financiador_nome ?? "—"}
                </p>
              </div>

              <div>
                <p className="detail-label text-xs uppercase tracking-[0.14em]">
                  Objetivos
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto?.objetivos.length ?? 0}
                </p>
              </div>

              <div>
                <p className="detail-label text-xs uppercase tracking-[0.14em]">
                  Links
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                  {projeto?.links.length ?? 0}
                </p>
              </div>
            </div>
          </section>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {projeto?.id && onAbrirTarefasProjeto ? (
              <button
                type="button"
                onClick={() => onAbrirTarefasProjeto(projeto.id)}
                className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
              >
                Abrir objetivos em Tarefas
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="button-neutral inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium"
            >
              Fechar
            </button>

            {mode !== "view" ? (
              <button
                type="submit"
                form="form-projeto"
                disabled={submitting}
                className="button-primary inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium disabled:opacity-60"
              >
                {submitting
                  ? "Salvando..."
                  : mode === "create"
                    ? "Salvar projeto"
                    : "Salvar alterações"}
              </button>
            ) : null}
          </div>
        </div>
      }
    />
  );
}