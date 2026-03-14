import { buscarUsuarioAtualTarefas } from "@/actions/tarefas/buscar-usuario-atual-tarefas";
import { listarCategoriasTarefas } from "@/actions/tarefas/listar-categorias-tarefas";
import { listarEquipesTarefas } from "@/actions/tarefas/listar-equipes-tarefas";
import { listarTarefas } from "@/actions/tarefas/listar-tarefas";
import { listarUsuariosElegiveis } from "@/actions/tarefas/listar-usuarios-elegiveis";
import { TarefasPageClient } from "@/components/tarefas/tarefas-page-client";
import type { EquipeTarefaOption } from "@/actions/tarefas/listar-equipes-tarefas";
import type {
  CategoriaTarefa,
  ResultadoOperacaoTarefa,
  Tarefa,
  TarefasPaginadas,
  UsuarioResumoTarefa,
} from "@/types/tarefas/tarefas.types";

export default async function TarefasPage() {
  const [
    resultadoInicial,
    resultadoUsuarios,
    resultadoEquipes,
    resultadoCategorias,
    resultadoUsuarioAtual,
  ] = await Promise.all([
    listarTarefas({
      pagina: 1,
      limite: 50,
    }),
    listarUsuariosElegiveis(),
    listarEquipesTarefas(),
    listarCategoriasTarefas({ ativo: true }),
    buscarUsuarioAtualTarefas(),
  ]);

  return (
    <TarefasPageClient
      resultadoInicial={
        resultadoInicial as ResultadoOperacaoTarefa<TarefasPaginadas<Tarefa>>
      }
      usuariosIniciais={
        (resultadoUsuarios.data ?? []) as UsuarioResumoTarefa[]
      }
      equipesIniciais={
        (resultadoEquipes.data ?? []) as EquipeTarefaOption[]
      }
      categoriasIniciais={
        (resultadoCategorias.data ?? []) as CategoriaTarefa[]
      }
      usuarioAtual={
        (resultadoUsuarioAtual.data ?? null) as UsuarioResumoTarefa | null
      }
    />
  );
}