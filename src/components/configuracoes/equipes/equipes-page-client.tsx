"use client";

import { useMemo, useState, useTransition } from "react";
import { buscarEquipeAction } from "@/actions/configuracoes/equipes/buscar-equipe";
import type {
  EquipeDetalhe,
  EquipeListItem,
} from "@/types/configuracoes/equipes.types";
import { EquipesToolbar } from "@/components/configuracoes/equipes/equipes-toolbar";
import { EquipesTable } from "@/components/configuracoes/equipes/equipes-table";
import { EquipeViewModal } from "@/components/configuracoes/equipes/equipe-view-modal";
import { EquipeCreateModal } from "@/components/configuracoes/equipes/equipe-create-modal";
import { EquipeEditModal } from "@/components/configuracoes/equipes/equipe-edit-modal";

type EquipesPageClientProps = {
  equipes: EquipeListItem[];
  podeCadastrar: boolean;
  podeEditar: boolean;
};

export function EquipesPageClient({
  equipes,
  podeCadastrar,
  podeEditar,
}: EquipesPageClientProps) {
  const [modalCriarAberta, setModalCriarAberta] = useState(false);
  const [modalVisualizarAberta, setModalVisualizarAberta] = useState(false);
  const [modalEditarAberta, setModalEditarAberta] = useState(false);
  const [equipeSelecionada, setEquipeSelecionada] = useState<EquipeDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [busca, setBusca] = useState("");

  const equipesUnicas = useMemo(
    () => Array.from(new Map(equipes.map((equipe) => [equipe.id, equipe])).values()),
    [equipes],
  );

  const equipesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return equipesUnicas.filter((equipe) => {
      if (termo.length === 0) return true;

      const descricao = equipe.descricao?.toLowerCase() ?? "";

      return (
        equipe.nome.toLowerCase().includes(termo) ||
        descricao.includes(termo)
      );
    });
  }, [equipesUnicas, busca]);

  function handleReload() {
    window.location.reload();
  }

  function handleVisualizar(id: string) {
    setErro(null);

    startTransition(async () => {
      const response = await buscarEquipeAction(id);

      if (!response.sucesso || !response.dados) {
        setErro(response.erro);
        return;
      }

      setEquipeSelecionada(response.dados);
      setModalVisualizarAberta(true);
    });
  }

  function handleEditar(id: string) {
    setErro(null);

    startTransition(async () => {
      const response = await buscarEquipeAction(id);

      if (!response.sucesso || !response.dados) {
        setErro(response.erro);
        return;
      }

      setEquipeSelecionada(response.dados);
      setModalEditarAberta(true);
    });
  }

  return (
    <div className="space-y-6">
      <EquipesToolbar
        podeCadastrar={podeCadastrar}
        onCadastrar={() => setModalCriarAberta(true)}
        busca={busca}
        onBuscaChange={setBusca}
      />

      {erro ? (
        <div className="status-danger rounded-xl px-4 py-3 text-sm">
          {erro}
        </div>
      ) : null}

      {isPending ? (
        <div className="status-neutral rounded-xl px-4 py-3 text-sm">
          Carregando dados da equipe...
        </div>
      ) : null}

      <EquipesTable
        equipes={equipesFiltradas}
        podeEditar={podeEditar}
        onVisualizar={handleVisualizar}
        onEditar={handleEditar}
      />

      <EquipeCreateModal
        aberta={modalCriarAberta}
        onClose={() => setModalCriarAberta(false)}
        onSuccess={handleReload}
      />

      <EquipeViewModal
        aberta={modalVisualizarAberta}
        equipe={equipeSelecionada}
        onClose={() => {
          setModalVisualizarAberta(false);
          setEquipeSelecionada(null);
        }}
      />

      <EquipeEditModal
        aberta={modalEditarAberta}
        equipe={equipeSelecionada}
        onClose={() => {
          setModalEditarAberta(false);
          setEquipeSelecionada(null);
        }}
        onSuccess={handleReload}
      />
    </div>
  );
}