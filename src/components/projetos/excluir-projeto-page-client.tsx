"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { buscarProjeto } from "@/actions/projetos/buscar-projeto";
import { criarFinanciador } from "@/actions/projetos/criar-financiador";
import { criarProjeto } from "@/actions/projetos/criar-projeto";
import { criarRubricaGlobal } from "@/actions/projetos/criar-rubrica-global";
import { editarProjeto } from "@/actions/projetos/editar-projeto";
import { ProjetoModal } from "@/components/projetos/projeto-modal";
import { ProjetosDashboardCards } from "@/components/projetos/projetos-dashboard-cards";
import { ProjetosFilters } from "@/components/projetos/projetos-filters";
import { ProjetosLista } from "@/components/projetos/projetos-lista";
import type {
  FinanciadorProjetoOption,
  ProjetoDetalhe,
  ProjetoFormData,
  ProjetoListItem,
  ProjetosDashboardResumo,
  ProjetosFiltros,
  ResultadoOperacaoProjeto,
  RubricaGlobalProjetoOption,
  UsuarioCoordenadorProjetoOption,
} from "@/types/projetos/projetos.types";

type Props = {
  resultadoProjetos: ResultadoOperacaoProjeto<ProjetoListItem[]>;
  resultadoDashboard: ResultadoOperacaoProjeto<ProjetosDashboardResumo>;
  coordenadores: UsuarioCoordenadorProjetoOption[];
  financiadores: FinanciadorProjetoOption[];
  rubricasGlobais: RubricaGlobalProjetoOption[];
  podeEditar: boolean;
};

type ModalMode = "create" | "edit" | "view";

export function ProjetosPageClient({
  resultadoProjetos,
  resultadoDashboard,
  coordenadores,
  financiadores: financiadoresIniciais,
  rubricasGlobais: rubricasIniciais,
  podeEditar,
}: Props) {
  const router = useRouter();

  const [filtros, setFiltros] = useState<ProjetosFiltros>({
    ordenacao: "data_inicio",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [projetoAtual, setProjetoAtual] = useState<ProjetoDetalhe | null>(null);
  const [mensagemOperacao, setMensagemOperacao] = useState<string | null>(null);
  const [salvandoProjeto, setSalvandoProjeto] = useState(false);
  const [carregandoProjeto, setCarregandoProjeto] = useState(false);
  const [financiadores, setFinanciadores] = useState(financiadoresIniciais);
  const [rubricasGlobais, setRubricasGlobais] = useState(rubricasIniciais);

  const erroInicial =
    (!resultadoProjetos.sucesso && resultadoProjetos.mensagem) ||
    (!resultadoDashboard.sucesso && resultadoDashboard.mensagem) ||
    null;

  const projetosBase = useMemo(
    () => resultadoProjetos.data ?? [],
    [resultadoProjetos.data],
  );

  const dashboard = resultadoDashboard.data ?? {
    total_projetos: 0,
    valor_total_orcamento: 0,
    projetos_concluidos: 0,
    projetos_em_execucao: 0,
  };

  const projetosFiltrados = useMemo(() => {
    const busca = filtros.busca?.trim().toLowerCase() ?? "";
    const tipos = filtros.tipo ?? [];
    const status = filtros.status ?? [];
    const ordenacao = filtros.ordenacao ?? "data_inicio";

    const filtrados = projetosBase.filter((item) => {
      if (busca) {
        const alvo = [
          item.nome,
          item.sigla,
          item.resumo ?? "",
          item.coordenador_nome ?? "",
          item.financiador_nome ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!alvo.includes(busca)) return false;
      }

      if (tipos.length > 0 && !tipos.includes(item.tipo)) return false;
      if (status.length > 0 && !status.includes(item.status)) return false;

      return true;
    });

    return [...filtrados].sort((a, b) => {
      switch (ordenacao) {
        case "nome":
          return a.nome.localeCompare(b.nome);
        case "orcamento_total":
          return (b.orcamento_total ?? 0) - (a.orcamento_total ?? 0);
        case "status":
          return a.status.localeCompare(b.status);
        case "data_inicio":
        default:
          return (
            new Date(b.data_inicio).getTime() -
            new Date(a.data_inicio).getTime()
          );
      }
    });
  }, [projetosBase, filtros]);

  async function abrirProjeto(projetoId: string, mode: ModalMode) {
    setMensagemOperacao(null);
    setCarregandoProjeto(true);
    setModalMode(mode);
    setModalOpen(true);

    const resultado = await buscarProjeto(projetoId);

    if (!resultado.sucesso) {
      setProjetoAtual(null);
      setMensagemOperacao(resultado.mensagem);
      setCarregandoProjeto(false);
      return;
    }

    setProjetoAtual(resultado.data ?? null);
    setCarregandoProjeto(false);
  }

  function abrirCriacao() {
    setMensagemOperacao(null);
    setProjetoAtual(null);
    setModalMode("create");
    setModalOpen(true);
  }

  async function handleSubmitProjeto(values: ProjetoFormData) {
    setMensagemOperacao(null);
    setSalvandoProjeto(true);

    const resultado =
      modalMode === "create"
        ? await criarProjeto(values)
        : projetoAtual?.id
          ? await editarProjeto(projetoAtual.id, values)
          : {
              sucesso: false,
              mensagem: "Projeto não encontrado para edição.",
            };

    setSalvandoProjeto(false);

    if (!resultado.sucesso) {
      setMensagemOperacao(resultado.mensagem);
      return;
    }

    setModalOpen(false);
    setProjetoAtual(null);
    router.refresh();
  }

  async function handleCriarFinanciador(nome: string) {
    const resultado = await criarFinanciador(nome);

    if (!resultado.sucesso || !resultado.data) {
      setMensagemOperacao(resultado.mensagem);
      return null;
    }

    setFinanciadores((current) =>
      [...current, resultado.data!].sort((a, b) => a.nome.localeCompare(b.nome)),
    );

    return resultado.data;
  }

  async function handleCriarRubricaGlobal(nome: string) {
    const resultado = await criarRubricaGlobal(nome);

    if (!resultado.sucesso || !resultado.data) {
      setMensagemOperacao(resultado.mensagem);
      return null;
    }

    setRubricasGlobais((current) =>
      [...current, resultado.data!].sort((a, b) => a.nome.localeCompare(b.nome)),
    );

    return resultado.data;
  }

  function handleAbrirTarefasProjeto(projetoId: string) {
    window.open(`/tarefas?projeto_id=${encodeURIComponent(projetoId)}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading-title text-2xl font-semibold md:text-3xl">
              Projetos
            </h1>
            <p
              className="section-heading-description mt-2 max-w-3xl text-sm leading-6 md:text-base"
            >
              Acompanhe a base de projetos da organização, com visão de status,
              orçamento, coordenação e objetivos vinculados nesta fase inicial do módulo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: "var(--surface-1)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              {projetosFiltrados.length} projeto(s)
            </div>

            {podeEditar ? (
              <button
                type="button"
                onClick={abrirCriacao}
                className="button-primary inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium"
              >
                Novo projeto
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {erroInicial ? (
        <div
          className="rounded-[var(--radius-2xl)] p-4 text-sm"
          style={{
            border: "1px solid #6b2328",
            backgroundColor: "#2a1316",
            color: "#fecaca",
          }}
        >
          {erroInicial}
        </div>
      ) : null}

      {mensagemOperacao ? (
        <div
          className="rounded-[var(--radius-2xl)] p-4 text-sm"
          style={{
            border: "1px solid #6b2328",
            backgroundColor: "#2a1316",
            color: "#fecaca",
          }}
        >
          {mensagemOperacao}
        </div>
      ) : null}

      <ProjetosDashboardCards resumo={dashboard} />
      <ProjetosFilters filtros={filtros} onChange={setFiltros} />

      <ProjetosLista
        projetos={projetosFiltrados}
        podeEditar={podeEditar}
        onVisualizar={(projetoId: string) => void abrirProjeto(projetoId, "view")}
        onEditar={
          podeEditar
            ? (projetoId: string) => void abrirProjeto(projetoId, "edit")
            : undefined
        }
      />

      <ProjetoModal
        open={modalOpen}
        mode={modalMode}
        projeto={projetoAtual}
        coordenadores={coordenadores}
        financiadores={financiadores}
        rubricasGlobais={rubricasGlobais}
        submitting={salvandoProjeto || carregandoProjeto}
        onClose={() => {
          if (salvandoProjeto) return;
          setModalOpen(false);
          setProjetoAtual(null);
        }}
        onSubmit={handleSubmitProjeto}
        onCriarFinanciador={podeEditar ? handleCriarFinanciador : undefined}
        onCriarRubricaGlobal={podeEditar ? handleCriarRubricaGlobal : undefined}
        onAbrirTarefasProjeto={handleAbrirTarefasProjeto}
      />
    </div>
  );
}