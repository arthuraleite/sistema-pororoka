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
  | { open: true; mode: "create"; tipo: "pai" | "filha" | "orfa" }
  | {
      open: true;
      mode: "view" | "edit";
      tipo: "pai" | "filha" | "orfa";
      tarefaId: string;
    };

type PayloadModalPai = {
  tipo: "pai";
  titulo: string;
  descricao?: string | null;
  projetoId?: string | null;
  prioridade?: "urgente" | "alta" | "media" | "baixa" | null;
  status?:
    | "a_fazer"
    | "em_andamento"
    | "atencao"
    | "em_pausa"
    | "em_atraso"
    | "concluida";
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
  status?:
    | "a_fazer"
    | "em_andamento"
    | "atencao"
    | "em_pausa"
    | "em_atraso"
    | "concluida";
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
  const [itensState, setItensState] = useState<Tarefa[]>(
    resultadoInicial.data?.itens ?? [],
  );
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [tarefaAtual, setTarefaAtual] = useState<TarefaDetalhe | null>(null);
  const [loadingTarefa, setLoadingTarefa] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [processingComment, setProcessingComment] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const erroInicial = !resultadoInicial.sucesso
    ? resultadoInicial.mensagem
    : null;

  const perfilAtualOriginal = usuarioAtual?.perfil ?? null;

  const perfilAtual =
    perfilAtualOriginal === "gestor_financeiro"
      ? "coordenador_equipe"
      : perfilAtualOriginal;

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

  const objetivosBase = useMemo(
    () => itens.filter((item) => item.tipo === "pai"),
    [itens],
  );

  const tarefasBase = useMemo(
    () => itens.filter((item) => item.tipo !== "pai"),
    [itens],
  );

  const objetivos = useMemo(() => {
    if (!podeVerObjetivos) return [];

    let filtrados = aplicarFiltrosLocais(objetivosBase, filtrosObjetivos);

    if (filtrosObjetivos.escopoObjetivo === "global") {
      filtrados = filtrados.filter(
        (item) => item.tipo === "pai" && item.escopoObjetivo === "global",
      );
    } else if (
      filtrosObjetivos.escopoObjetivo &&
      filtrosObjetivos.escopoObjetivo !== "todos"
    ) {
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

  const categoriasFiltroTarefas = useMemo(() => {
    const equipeSelecionadaId = filtrosTarefas.equipeIds?.[0] ?? "";

    if (!equipeSelecionadaId) {
      return [];
    }

    return categoriasIniciais.filter(
      (categoria) => categoria.equipeId === equipeSelecionadaId,
    );
  }, [categoriasIniciais, filtrosTarefas.equipeIds]);

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

          const prazo =
            prazoTimestamp(a.prazo, a.horaEntrega) -
            prazoTimestamp(b.prazo, b.horaEntrega);
          if (prazo !== 0) return prazo;

          const prioridade =
            prioridadePeso(a.prioridade) - prioridadePeso(b.prioridade);
          if (prioridade !== 0) return prioridade;

          return a.titulo.localeCompare(b.titulo);
        }),
    [tarefasFiltradas, objetivosTituloMap],
  );

  const tarefasPaiOptions = useMemo(
    () =>
      itens
        .filter((item) => item.tipo === "pai")
        .map((item) => ({
          id: item.id,
          titulo: item.titulo,
        })),
    [itens],
  );

  async function recarregarDetalheAtual(tarefaId: string) {
    const resultado = await buscarTarefa({ tarefaId });

    if (!resultado.sucesso || !resultado.data) {
      throw new Error(
        resultado.mensagem || "Não foi possível recarregar a tarefa.",
      );
    }

    setTarefaAtual(resultado.data);
    upsertListaComDetalhe(resultado.data);
    return resultado.data;
  }

  function upsertListaComDetalhe(detalhe: TarefaDetalhe) {
    setItensState((current) => {
      const baseAtualizada = detalheParaTarefaBase(detalhe);
      const existe = current.some((item) => item.id === detalhe.id);

      if (!existe) {
        return [baseAtualizada, ...current];
      }

      return current.map((item) =>
        item.id === detalhe.id ? baseAtualizada : item,
      );
    });
  }

  async function abrirTarefaPorId(
    tarefaId: string,
    mode: "view" | "edit" = "view",
  ) {
    setErroAcao(null);
    setLoadingTarefa(true);

    try {
      const resultado = await buscarTarefa({ tarefaId });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível carregar a tarefa.",
        );
      }

      setTarefaAtual(resultado.data);
      setModal({
        open: true,
        mode,
        tipo: resultado.data.tipo,
        tarefaId,
      });
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao abrir tarefa.",
      );
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
        throw new Error(
          resultado.mensagem || "Não foi possível criar a tarefa.",
        );
      }

      upsertListaComDetalhe(resultado.data);
      fecharModal();
    } catch (error) {
      setErroAcao(
        error instanceof Error
          ? error.message
          : `Erro ao criar tarefa: ${String(error)}`,
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function salvarEdicaoTarefa(values: Omit<EditarTarefaInput, "id">) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await editarTarefa({
        ...values,
        id: tarefaAtual.id,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível editar a tarefa.",
        );
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
            equipe:
              detalhe.tipo !== "pai"
                ? (detalhe.equipe ?? item.equipe)
                : item.equipe,
            categoria:
              detalhe.tipo !== "pai"
                ? (detalhe.categoria ?? item.categoria)
                : item.categoria,
          } as typeof item;
        }),
      );

      fecharModal();
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao editar tarefa.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleAtualizarStatus(novoStatus: StatusTarefa) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await moverTarefaStatus({
        id: tarefaAtual.id,
        novoStatus,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível atualizar o status.",
        );
      }

      setTarefaAtual(resultado.data);
      upsertListaComDetalhe(resultado.data);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao atualizar status.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function moverCardKanban(
    cardId: string,
    novoStatus: TarefaKanbanCard["status"],
  ) {
    setErroAcao(null);

    try {
      const resultado = await moverTarefaStatus({
        id: cardId,
        novoStatus,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível mover a tarefa.",
        );
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
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao mover tarefa no kanban.",
      );
    }
  }

  async function handleReabrir(
    novoStatus: Exclude<StatusTarefa, "concluida" | "em_atraso">,
  ) {
    if (!tarefaAtual) return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await reabrirTarefa({
        id: tarefaAtual.id,
        novoStatus,
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível reabrir a tarefa.",
        );
      }

      setTarefaAtual(resultado.data);
      upsertListaComDetalhe(resultado.data);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao reabrir tarefa.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleExcluirTarefa() {
    if (!tarefaAtual || tarefaAtual.tipo === "pai") return;

    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await excluirTarefa({
        id: tarefaAtual.id,
      });

      if (!resultado.sucesso) {
        throw new Error(
          resultado.mensagem || "Não foi possível excluir a tarefa.",
        );
      }

      setItensState((current) =>
        current.filter((item) => item.id !== tarefaAtual.id),
      );
      fecharModal();
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao excluir tarefa.",
      );
    } finally {
      setSubmittingModal(false);
    }
  }

  async function handleAdicionarComentario(values: {
    conteudo: string;
    linkExterno?: string | null;
    comentarioPaiId?: string | null;
  }) {
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
        throw new Error(
          resultado.mensagem || "Não foi possível adicionar o comentário.",
        );
      }

      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(
        error instanceof Error
          ? error.message
          : "Erro ao adicionar comentário.",
      );
    } finally {
      setProcessingComment(false);
    }
  }

  async function handleEditarComentario(values: {
    comentarioId: string;
    conteudo: string;
    linkExterno?: string | null;
  }) {
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
        throw new Error(
          resultado.mensagem || "Não foi possível editar o comentário.",
        );
      }

      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao editar comentário.",
      );
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
        throw new Error(
          resultado.mensagem || "Não foi possível excluir o comentário.",
        );
      }

      await recarregarDetalheAtual(tarefaAtual.id);
    } catch (error) {
      setErroAcao(
        error instanceof Error ? error.message : "Erro ao excluir comentário.",
      );
    } finally {
      setProcessingComment(false);
    }
  }

  async function handleCarregarFilhaPersistida(filhaId: string) {
    try {
      const resultado = await buscarTarefa({ tarefaId: filhaId });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível carregar a tarefa filha.",
        );
      }

      const detalhe = resultado.data;

      if (detalhe.tipo !== "filha") {
        return null;
      }

      return {
        titulo: detalhe.titulo,
        descricao: detalhe.descricao ?? "",
        equipeId: detalhe.equipeId ?? "",
        categoriaId: detalhe.categoria?.id ?? "",
        prioridade: detalhe.prioridade ?? "media",
        dataEntrega: detalhe.dataEntrega,
        horaEntrega: detalhe.horaEntrega ?? "",
        responsavelIds: detalhe.responsaveis.map((item) => item.id),
        status: detalhe.status,
      };
    } catch (error) {
      setErroAcao(
        error instanceof Error
          ? error.message
          : "Erro ao carregar tarefa filha.",
      );
      return null;
    }
  }

  async function handleSalvarFilhaPersistida(
    filhaId: string,
    values: {
      titulo: string;
      descricao?: string | null;
      equipeId: string;
      categoriaId: string;
      prioridade?: "urgente" | "alta" | "media" | "baixa";
      dataEntrega: string;
      horaEntrega?: string | null;
      responsavelIds: string[];
      status?: StatusTarefa;
    },
  ) {
    setErroAcao(null);
    setSubmittingModal(true);

    try {
      const resultado = await editarTarefa({
        id: filhaId,
        tipo: "filha",
        titulo: values.titulo,
        descricao: values.descricao ?? null,
        equipeId: values.equipeId,
        categoriaId: values.categoriaId,
        prioridade: values.prioridade ?? "media",
        status: values.status ?? "a_fazer",
        dataEntrega: values.dataEntrega,
        horaEntrega: values.horaEntrega ?? null,
        responsavelIds: values.responsavelIds,
        tarefaPaiId:
          tarefaAtual && tarefaAtual.tipo === "pai" ? tarefaAtual.id : undefined,
        links: [],
      });

      if (!resultado.sucesso || !resultado.data) {
        throw new Error(
          resultado.mensagem || "Não foi possível salvar a tarefa filha.",
        );
      }

      if (tarefaAtual && tarefaAtual.tipo === "pai") {
        await recarregarDetalheAtual(tarefaAtual.id);
      }
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao salvar tarefa filha.";
      setErroAcao(mensagem);
      throw error instanceof Error ? error : new Error(mensagem);
    } finally {
      setSubmittingModal(false);
    }
  }

  return (
    <div className="space-y-6">
      {erroInicial ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            border: "1px solid #6b2328",
            backgroundColor: "#2a1316",
            color: "#fecaca",
          }}
        >
          {erroInicial}
        </div>
      ) : null}

      {erroAcao ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            border: "1px solid #6b2328",
            backgroundColor: "#2a1316",
            color: "#fecaca",
          }}
        >
          {erroAcao}
        </div>
      ) : null}

      {loadingTarefa ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            backgroundColor: "var(--surface-1)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
        >
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
          onCriarObjetivo={() =>
            setModal({ open: true, mode: "create", tipo: "pai" })
          }
          onAbrirObjetivo={(objetivoId) => abrirTarefaPorId(objetivoId, "view")}
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
        categorias={categoriasFiltroTarefas}
        podeVerObjetivos={podeVerObjetivos}
        podeVerTodasEquipes={podeVerTodasEquipes}
        objetivosTituloMap={objetivosTituloMap}
        onCriarTarefa={() => setModal({ open: true, mode: "create", tipo: "orfa" })}
        onAbrirTarefa={(taskId) => abrirTarefaPorId(taskId, "view")}
        onMoverCardKanban={moverCardKanban}
      />

      {modal.open && modal.tipo === "pai" ? (
        <TarefaPaiModal
          open
          isNew={modal.mode === "create"}
          tarefa={tarefaAtual?.tipo === "pai" ? tarefaAtual : null}
          usuarios={usuariosIniciais}
          categorias={categoriasIniciais}
          equipes={equipesIniciais}
          usuarioAtualId={usuarioAtual?.id ?? null}
          podeModerarComentarios
          podeSelecionarObjetivoGlobal={podeSelecionarObjetivoGlobal}
          onClose={fecharModal}
          onReabrir={handleReabrir}
          onCarregarFilhaPersistida={handleCarregarFilhaPersistida}
          onSalvarFilhaPersistida={handleSalvarFilhaPersistida}
          onSubmit={async (values: PayloadModalPai) => {
            if (modal.mode === "create") {
              await criarNovaTarefa(values as CriarTarefaInput);
              return;
            }

            await salvarEdicaoTarefa(values as Omit<EditarTarefaInput, "id">);
            if (tarefaAtual?.id) {
              await recarregarDetalheAtual(tarefaAtual.id);
            }
          }}
          onAdicionarComentario={handleAdicionarComentario}
          onEditarComentario={handleEditarComentario}
          onExcluirComentario={handleExcluirComentario}
        />
      ) : null}

      {modal.open && (modal.tipo === "filha" || modal.tipo === "orfa") ? (
        <TarefaOperacionalModal
          open
          mode={modal.mode}
          tipo={modal.tipo}
          tarefa={
            tarefaAtual &&
            (tarefaAtual.tipo === "filha" || tarefaAtual.tipo === "orfa")
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
          onEditRequest={() => {
            if (
              !tarefaAtual ||
              (tarefaAtual.tipo !== "filha" && tarefaAtual.tipo !== "orfa")
            ) {
              return;
            }

            setModal({
              open: true,
              mode: "edit",
              tipo: tarefaAtual.tipo,
              tarefaId: tarefaAtual.id,
            });
          }}
          onViewRequest={() => {
            if (
              !tarefaAtual ||
              (tarefaAtual.tipo !== "filha" && tarefaAtual.tipo !== "orfa")
            ) {
              return;
            }

            setModal({
              open: true,
              mode: "view",
              tipo: tarefaAtual.tipo,
              tarefaId: tarefaAtual.id,
            });
          }}
          onAtualizarStatus={handleAtualizarStatus}
          onReabrir={handleReabrir}
          onExcluir={handleExcluirTarefa}
          onSubmit={async (values: PayloadModalOperacional) => {
            if (modal.mode === "create") {
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
        <div
          className="fixed bottom-4 right-4 rounded-2xl px-4 py-3 text-sm shadow-xl"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface-1)",
            color: "var(--text-2)",
          }}
        >
          {submittingModal
            ? "Salvando alterações..."
            : "Atualizando comentários..."}
        </div>
      ) : null}
    </div>
  );
}
