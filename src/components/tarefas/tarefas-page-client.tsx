"use client";

import { useMemo, useState } from "react";

import { adicionarComentario } from "@/actions/tarefas/adicionar-comentario";
import { buscarTarefa } from "@/actions/tarefas/buscar-tarefa";
import { criarTarefa } from "@/actions/tarefas/criar-tarefa";
import { editarComentario } from "@/actions/tarefas/editar-comentario";
import { editarTarefa } from "@/actions/tarefas/editar-tarefa";
import { excluirComentario } from "@/actions/tarefas/excluir-comentario";
import { excluirTarefa } from "@/actions/tarefas/excluir-tarefa";
import type { EquipeTarefaOption } from "@/actions/tarefas/listar-equipes-tarefas";
import { moverTarefaStatus } from "@/actions/tarefas/mover-tarefa-status";
import { reabrirTarefa } from "@/actions/tarefas/reabrir-tarefa";
import { TarefaOperacionalModal } from "@/components/tarefas/tarefa-operacional-modal";
import { TarefaPaiModal } from "@/components/tarefas/tarefa-pai-modal";
import { ObjetivosSection } from "@/components/tarefas/objetivos-section";
import type {
  ComentarioDraft,
  TarefaFilhaDraft,
} from "@/components/tarefas/hooks/use-tarefa-pai-draft";
import {
  aplicarFiltrosLocais,
  detalheParaTarefaBase,
  mapResponsaveisResumo,
  prazoTimestamp,
  prioridadePeso,
} from "@/components/tarefas/tarefas-page.utils";
import { TarefasSection } from "@/components/tarefas/tarefas-section";
import type {
  CategoriaTarefa,
  CriarTarefaInput,
  EditarTarefaInput,
  ResultadoOperacaoTarefa,
  StatusTarefa,
  Tarefa,
  TarefaDetalhe,
  TarefaKanbanCard,
  TarefasFiltros,
  TarefasPaginadas,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

type Props = {
  resultadoInicial: ResultadoOperacaoTarefa<TarefasPaginadas<Tarefa>>;
  usuariosIniciais: UsuarioResumoTarefa[];
  equipesIniciais: EquipeTarefaOption[];
  categoriasIniciais: CategoriaTarefa[];
  usuarioAtual: UsuarioResumoTarefa | null;
};

type ViewMode = "kanban" | "table" | "week";

type ModalState =
  | { open: false }
  | {
      open: true;
      tipo: "pai" | "filha" | "orfa";
      isNew: boolean;
      tarefaId?: string;
    };

type PayloadModalPai = {
  tipo: "pai";
  titulo: string;
  descricao?: string | null;
  projetoId?: string | null;
  prioridade?: "urgente" | "alta" | "media" | "baixa" | null;
  status?: StatusTarefa;
  escopoObjetivo?: "global" | "equipe";
  equipeId?: string | null;
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: string[];
  links: Array<{ id?: string; url: string; texto?: string | null }>;
};

type PayloadModalOperacional = {
  tipo: "filha" | "orfa";
  titulo: string;
  descricao?: string | null;
  tarefaPaiId?: string | null;
  equipeId?: string | null;
  categoriaId?: string | null;
  prioridade?: "urgente" | "alta" | "media" | "baixa" | null;
  status?: StatusTarefa;
  dataEntrega: string;
  horaEntrega?: string | null;
  responsavelIds: string[];
  links: Array<{ id?: string; url: string; texto?: string | null }>;
};

function mapTarefaToKanbanCard(
  tarefa: Tarefa,
  objetivosMap: Map<string, string>,
): TarefaKanbanCard {
  return {
    id: tarefa.id,
    tipo: tarefa.tipo,
    titulo: tarefa.titulo,
    status: tarefa.status,
    prioridade: tarefa.prioridade,
    categoria:
      tarefa.tipo === "pai" || !tarefa.categoria
        ? null
        : {
            id: tarefa.categoria.id,
            nome: tarefa.categoria.nome,
          },
    equipe: tarefa.tipo === "pai" ? null : tarefa.equipe,
    objetivoTitulo:
      tarefa.tipo === "filha" && tarefa.tarefaPaiId
        ? (objetivosMap.get(tarefa.tarefaPaiId) ?? null)
        : null,
    prazo: tarefa.dataEntrega,
    horaEntrega: tarefa.horaEntrega,
    responsaveis: mapResponsaveisResumo(tarefa.responsaveis),
    emAtraso: tarefa.status === "em_atraso",
  };
}

export function TarefasPageClient({
  resultadoInicial,
  usuariosIniciais,
  equipesIniciais,
  categoriasIniciais,
  usuarioAtual,
}: Props) {
  const [view, setView] = useState<ViewMode>("kanban");
  const [filtrosObjetivos, setFiltrosObjetivos] = useState<TarefasFiltros>({
    ordenacao: "data_entrega",
    responsavelIds: usuarioAtual?.id ? [usuarioAtual.id] : [],
    escopoObjetivo: "todos",
  });
  const [filtrosTarefas, setFiltrosTarefas] = useState<TarefasFiltros>({
    ordenacao: "data_entrega",
    responsavelIds: usuarioAtual?.id ? [usuarioAtual.id] : [],
  });
  const [itensState, setItensState] = useState<Tarefa[]>(resultadoInicial.data?.itens ?? []);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [tarefaAtual, setTarefaAtual] = useState<TarefaDetalhe | null>(null);
  const [loadingTarefa, setLoadingTarefa] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [processingComment, setProcessingComment] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const erroInicial = !resultadoInicial.sucesso ? resultadoInicial.mensagem : null;
  const perfilAtual = usuarioAtual?.perfil ?? null;

  const podeVerObjetivos = [
    "admin_supremo",
    "coordenador_geral",
    "coordenador_equipe",
    "assistente",
  ].includes(perfilAtual ?? "");

  const podeCriarObjetivos = [
    "admin_supremo",
    "coordenador_geral",
    "coordenador_equipe",
    "assistente",
  ].includes(perfilAtual ?? "");

  const podeSelecionarObjetivoGlobal = ["admin_supremo", "coordenador_geral"].includes(
    perfilAtual ?? "",
  );

  const podeVerTodasEquipes = ["admin_supremo", "coordenador_geral"].includes(
    perfilAtual ?? "",
  );

  const itens = useMemo(() => itensState, [itensState]);
  const objetivosBase = useMemo(() => itens.filter((item) => item.tipo === "pai"), [itens]);
  const tarefasBase = useMemo(() => itens.filter((item) => item.tipo !== "pai"), [itens]);

  const objetivos = useMemo(() => {
    if (!podeVerObjetivos) return [];
    let filtrados = aplicarFiltrosLocais(objetivosBase, filtrosObjetivos);

    if (filtrosObjetivos.escopoObjetivo === "global") {
      filtrados = filtrados.filter(
        (item) => item.tipo === "pai" && item.escopoObjetivo === "global",
      );
    } else if (filtrosObjetivos.escopoObjetivo && filtrosObjetivos.escopoObjetivo !== "todos") {
      filtrados = filtrados.filter(
        (item) =>
          item.tipo === "pai" &&
          item.escopoObjetivo === "equipe" &&
          item.equipeId === filtrosObjetivos.escopoObjetivo,
      );
    }

    return [...filtrados].sort((a, b) => {
      const aConcluido = a.status === "concluida";
      const bConcluido = b.status === "concluida";
      if (aConcluido && !bConcluido) return 1;
      if (!aConcluido && bConcluido) return -1;
      return (
        prazoTimestamp(a.dataEntrega, a.horaEntrega) -
        prazoTimestamp(b.dataEntrega, b.horaEntrega)
      );
    });
  }, [objetivosBase, filtrosObjetivos, podeVerObjetivos]);

  const tarefasFiltradas = useMemo(
    () => aplicarFiltrosLocais(tarefasBase, filtrosTarefas),
    [tarefasBase, filtrosTarefas],
  );

  const objetivosTituloMap = useMemo(
    () => new Map(objetivosBase.map((objetivo) => [objetivo.id, objetivo.titulo])),
    [objetivosBase],
  );

  const cardsKanban = useMemo(
    () =>
      tarefasFiltradas
        .map((tarefa) => mapTarefaToKanbanCard(tarefa, objetivosTituloMap))
        .sort((a, b) => {
          if (a.emAtraso && !b.emAtraso) return -1;
          if (!a.emAtraso && b.emAtraso) return 1;
          const prazo = prazoTimestamp(a.prazo, a.horaEntrega) - prazoTimestamp(b.prazo, b.horaEntrega);
          if (prazo !== 0) return prazo;
          const prioridade = prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
          if (prioridade !== 0) return prioridade;
          return a.titulo.localeCompare(b.titulo);
        }),
    [tarefasFiltradas, objetivosTituloMap],
  );

  const tarefasPaiOptions = useMemo(
    () =>
      itens.filter((item) => item.tipo === "pai").map((item) => ({ id: item.id, titulo: item.titulo })),
    [itens],
  );

  async function recarregarDetalheAtual(tarefaId: string) {
    const resultado = await buscarTarefa({ tarefaId });
    if (!resultado.sucesso || !resultado.data) {
      throw new Error(resultado.mensagem || "Não foi possível recarregar a tarefa.");
    }
    setTarefaAtual(resultado.data);
    upsertListaComDetalhe(resultado.data);
  }

  function upsertListaComDetalhe(detalhe: TarefaDetalhe) {
    setItensState((current) => {
      const baseAtualizada = detalheParaTarefaBase(detalhe);
      const existe = current.some((item) => item.id === detalhe.id);
      if (!existe) return [baseAtualizada, ...current];
      return current.map((item) => (item.id === detalhe.id ? baseAtualizada : item));
    });
  }

  async function abrirTarefaPorId(tarefaId: string) {
    setErroAcao(null);
    setLoadingTarefa(true);
    try {
      const resultado = await buscarTarefa({ tarefaId });
      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível carregar a tarefa.");
      }
      setTarefaAtual(resultado.data);
      setModal({ open: true, tipo: resultado.data.tipo, tarefaId, isNew: false });
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao abrir tarefa.");
    } finally {
      setLoadingTarefa(false);
    }
  }

  function fecharModal() {
    setModal({ open: false });
    setTarefaAtual(null);
    setErroAcao(null);
  }

  async function criarNovaTarefa(values: CriarTarefaInput) {
    setErroAcao(null);
    setSubmittingModal(true);
    try {
      const resultado = await criarTarefa(values);
      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível criar a tarefa.");
      }
      upsertListaComDetalhe(resultado.data);
      fecharModal();
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : `Erro ao criar tarefa: ${String(error)}`);
    } finally {
      setSubmittingModal(false);
    }
  }

  async function criarObjetivoComDependencias(
    values: CriarTarefaInput,
    extras?: { filhasDraft: TarefaFilhaDraft[]; comentariosDraft: ComentarioDraft[] },
  ) {
    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultadoObjetivo = await criarTarefa(values);
      if (!resultadoObjetivo.sucesso || !resultadoObjetivo.data) {
        throw new Error(resultadoObjetivo.mensagem || "Não foi possível criar o objetivo.");
      }

      const objetivoId = resultadoObjetivo.data.id;

      for (const filha of extras?.filhasDraft ?? []) {
        const resultadoFilha = await criarTarefa({
          tipo: "filha",
          escopoObjetivo: null,
          titulo: filha.titulo,
          descricao: filha.descricao ?? null,
          tarefaPaiId: objetivoId,
          equipeId: filha.equipeId,
          categoriaId: filha.categoriaId,
          prioridade: filha.prioridade,
          status: filha.status,
          dataEntrega: filha.dataEntrega,
          horaEntrega: filha.horaEntrega ?? null,
          responsavelIds: filha.responsavelIds,
          links: [],
        });

        if (!resultadoFilha.sucesso) {
          throw new Error(resultadoFilha.mensagem || `Não foi possível criar a tarefa filha ${filha.titulo}.`);
        }
      }

      for (const comentario of extras?.comentariosDraft ?? []) {
        const resultadoComentario = await adicionarComentario({
          tarefaId: objetivoId,
          comentarioPaiId: comentario.comentarioPaiId ?? null,
          conteudo: comentario.conteudo,
          linkExterno: comentario.linkExterno ?? null,
        });

        if (!resultadoComentario.sucesso) {
          throw new Error(resultadoComentario.mensagem || "Não foi possível salvar um comentário em rascunho.");
        }
      }

      await recarregarDetalheAtual(objetivoId);
      setModal({ open: true, tipo: "pai", tarefaId: objetivoId, isNew: false });
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao criar objetivo.");
    } finally {
      setSubmittingModal(false);
    }
  }

  async function salvarEdicaoTarefa(values: Omit<EditarTarefaInput, "id">) {
    if (!tarefaAtual) return;
    setErroAcao(null);
    setSubmittingModal(true);
    try {
      const resultado = await editarTarefa({ ...values, id: tarefaAtual.id });
      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível editar a tarefa.");
      }
      const detalhe = resultado.data;
      setTarefaAtual(detalhe);
      setItensState((atual) =>
        atual.map((item) => {
          if (item.id !== detalhe.id) return item;
          return {
            ...item,
            titulo: detalhe.titulo,
            descricao: detalhe.descricao,
            prioridade: detalhe.prioridade,
            status: detalhe.status,
            dataEntrega: detalhe.dataEntrega,
            horaEntrega: detalhe.horaEntrega,
            dataConclusao: detalhe.dataConclusao,
            dataAtualizacao: detalhe.dataAtualizacao,
            responsaveis:
              detalhe.responsaveis?.length > 0
                ? detalhe.responsaveis.map((responsavel) => ({
                    id: responsavel.id,
                    nome: responsavel.nome,
                    avatarUrl: responsavel.avatarUrl ?? null,
                  }))
                : item.responsaveis,
            equipe: detalhe.tipo !== "pai" ? detalhe.equipe ?? item.equipe : item.equipe,
            categoria: detalhe.tipo !== "pai" ? detalhe.categoria ?? item.categoria : item.categoria,
          } as typeof item;
        }),
      );
      fecharModal();
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao editar tarefa.");
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleAtualizarStatus(novoStatus: StatusTarefa) {
    if (!tarefaAtual) return;
    setErroAcao(null);
    setSubmittingModal(true);
    try {
      const resultado = await moverTarefaStatus({ id: tarefaAtual.id, novoStatus });
      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível atualizar o status.");
      }
      setTarefaAtual(resultado.data);
      upsertListaComDetalhe(resultado.data);
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao atualizar status.");
    } finally {
      setSubmittingModal(false);
    }
  }

  async function moverCardKanban(cardId: string, novoStatus: TarefaKanbanCard["status"]) {
    setErroAcao(null);
    try {
      const resultado = await moverTarefaStatus({ id: cardId, novoStatus });
      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível mover a tarefa.");
      }
      setItensState((atual) =>
        atual.map((item) =>
          item.id === cardId
            ? {
                ...item,
                status: resultado.data!.status,
                dataConclusao: resultado.data!.dataConclusao ?? null,
                dataAtualizacao: resultado.data!.dataAtualizacao,
              }
            : item,
        ),
      );
      if (tarefaAtual?.id === cardId) {
        setTarefaAtual((atual) =>
          atual
            ? {
                ...atual,
                status: resultado.data!.status,
                dataConclusao: resultado.data!.dataConclusao ?? null,
                dataAtualizacao: resultado.data!.dataAtualizacao,
              }
            : atual,
        );
      }
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao mover tarefa no kanban.");
    }
  }

  async function handleReabrir(novoStatus: Exclude<StatusTarefa, "concluida" | "em_atraso">) {
    if (!tarefaAtual) return;
    setErroAcao(null);
    setSubmittingModal(true);
    try {
      const resultado = await reabrirTarefa({ id: tarefaAtual.id, novoStatus });
      if (!resultado.sucesso || !resultado.data) {
        throw new Error(resultado.mensagem || "Não foi possível reabrir a tarefa.");
      }
      setTarefaAtual(resultado.data);
      upsertListaComDetalhe(resultado.data);
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao reabrir tarefa.");
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleExcluirTarefa() {
    if (!tarefaAtual || tarefaAtual.tipo === "pai") return;
    setErroAcao(null);
    setSubmittingModal(true);
    try {
      const resultado = await excluirTarefa({ id: tarefaAtual.id });
      if (!resultado.sucesso) {
        throw new Error(resultado.mensagem || "Não foi possível excluir a tarefa.");
      }
      setItensState((current) => current.filter((item) => item.id !== tarefaAtual.id));
      fecharModal();
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao excluir tarefa.");
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleAdicionarComentario(values: { conteudo: string; linkExterno?: string | null; comentarioPaiId?: string | null }) {
    if (!tarefaAtual) return;
    setErroAcao(null);
    setProcessingComment(true);
    try {
      const resultado = await adicionarComentario({
        tarefaId: tarefaAtual.id,
        comentarioPaiId: values.comentarioPaiId ?? null,
        conteudo: values.conteudo,
        linkExterno: values.linkExterno ?? null,
      });
      if (!resultado.sucesso) {
        throw new Error(resultado.mensagem || "Não foi possível adicionar o comentário.");
      }
      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao adicionar comentário.");
    } finally {
      setProcessingComment(false);
    }
  }

  async function handleEditarComentario(values: { comentarioId: string; conteudo: string; linkExterno?: string | null }) {
    if (!tarefaAtual) return;
    setErroAcao(null);
    setProcessingComment(true);
    try {
      const resultado = await editarComentario({
        comentarioId: values.comentarioId,
        conteudo: values.conteudo,
        linkExterno: values.linkExterno ?? null,
      });
      if (!resultado.sucesso) {
        throw new Error(resultado.mensagem || "Não foi possível editar o comentário.");
      }
      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao editar comentário.");
    } finally {
      setProcessingComment(false);
    }
  }

  async function handleExcluirComentario(comentarioId: string) {
    if (!tarefaAtual) return;
    setErroAcao(null);
    setProcessingComment(true);
    try {
      const resultado = await excluirComentario({ comentarioId });
      if (!resultado.sucesso) {
        throw new Error(resultado.mensagem || "Não foi possível excluir o comentário.");
      }
      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(error instanceof Error ? error.message : "Erro ao excluir comentário.");
    } finally {
      setProcessingComment(false);
    }
  }

  return (
    <div className="space-y-6">
      {erroInicial ? (
        <div className="rounded-2xl p-4 text-sm" style={{ border: "1px solid #6b2328", backgroundColor: "#2a1316", color: "#fecaca" }}>
          {erroInicial}
        </div>
      ) : null}

      {erroAcao ? (
        <div className="rounded-2xl p-4 text-sm" style={{ border: "1px solid #6b2328", backgroundColor: "#2a1316", color: "#fecaca" }}>
          {erroAcao}
        </div>
      ) : null}

      {loadingTarefa ? (
        <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
          Carregando tarefa...
        </div>
      ) : null}

      {podeVerObjetivos ? (
        <ObjetivosSection
          objetivos={objetivos}
          tarefasBase={tarefasBase}
          usuarios={usuariosIniciais}
          equipes={equipesIniciais}
          usuarioAtual={usuarioAtual}
          filtros={filtrosObjetivos}
          onChangeFiltros={setFiltrosObjetivos}
          podeCriarObjetivos={podeCriarObjetivos}
          podeVerTodasEquipes={podeVerTodasEquipes}
          onCriarObjetivo={() => setModal({ open: true, tipo: "pai", isNew: true })}
          onAbrirObjetivo={(objetivoId) => abrirTarefaPorId(objetivoId)}
        />
      ) : null}

      <TarefasSection
        view={view}
        onChangeView={setView}
        tarefas={tarefasFiltradas}
        cardsKanban={cardsKanban}
        filtros={filtrosTarefas}
        onChangeFiltros={setFiltrosTarefas}
        usuarios={usuariosIniciais}
        equipes={equipesIniciais}
        podeVerObjetivos={podeVerObjetivos}
        podeVerTodasEquipes={podeVerTodasEquipes}
        objetivosTituloMap={objetivosTituloMap}
        onCriarTarefa={() => setModal({ open: true, tipo: "orfa", isNew: true })}
        onAbrirTarefa={(taskId) => abrirTarefaPorId(taskId)}
        onMoverCardKanban={moverCardKanban}
      />

      {modal.open && modal.tipo === "pai" ? (
        <TarefaPaiModal
          open
          isNew={modal.isNew}
          tarefa={tarefaAtual?.tipo === "pai" ? tarefaAtual : null}
          usuarios={usuariosIniciais}
          categorias={categoriasIniciais}
          equipes={equipesIniciais}
          usuarioAtualId={usuarioAtual?.id ?? null}
          podeModerarComentarios
          podeSelecionarObjetivoGlobal={podeSelecionarObjetivoGlobal}
          onClose={fecharModal}
          onAtualizarStatus={handleAtualizarStatus}
          onReabrir={handleReabrir}
          onSubmit={async (values: PayloadModalPai, extras) => {
            if (modal.isNew) {
              await criarObjetivoComDependencias(values as CriarTarefaInput, extras);
              return;
            }
            await salvarEdicaoTarefa(values as Omit<EditarTarefaInput, "id">);
          }}
          onAdicionarComentario={handleAdicionarComentario}
          onEditarComentario={handleEditarComentario}
          onExcluirComentario={handleExcluirComentario}
        />
      ) : null}

      {modal.open && (modal.tipo === "filha" || modal.tipo === "orfa") ? (
        <TarefaOperacionalModal
          open
          mode={modal.isNew ? "create" : "edit"}
          tipo={modal.tipo}
          tarefa={
            tarefaAtual && (tarefaAtual.tipo === "filha" || tarefaAtual.tipo === "orfa")
              ? tarefaAtual
              : null
          }
          usuarios={usuariosIniciais}
          usuarioAtualId={usuarioAtual?.id ?? null}
          podeModerarComentarios
          equipes={equipesIniciais}
          categorias={categoriasIniciais}
          tarefasPaiOptions={tarefasPaiOptions}
          onClose={fecharModal}
          onEditRequest={() => undefined}
          onViewRequest={() => undefined}
          onAtualizarStatus={handleAtualizarStatus}
          onReabrir={handleReabrir}
          onExcluir={handleExcluirTarefa}
          onSubmit={async (values: PayloadModalOperacional) => {
            if (modal.isNew) {
              await criarNovaTarefa(values as CriarTarefaInput);
              return;
            }
            await salvarEdicaoTarefa(values as Omit<EditarTarefaInput, "id">);
          }}
          onAdicionarComentario={handleAdicionarComentario}
          onEditarComentario={handleEditarComentario}
          onExcluirComentario={handleExcluirComentario}
        />
      ) : null}

      {submittingModal || processingComment ? (
        <div className="fixed bottom-4 right-4 rounded-2xl px-4 py-3 text-sm shadow-xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface-1)", color: "var(--text-2)" }}>
          {submittingModal ? "Salvando alterações..." : "Atualizando comentários..."}
        </div>
      ) : null}
    </div>
  );
}
