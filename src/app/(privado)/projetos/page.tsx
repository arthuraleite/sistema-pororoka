import { buscarDashboardProjetos } from "@/actions/projetos/buscar-dashboard-projetos";
import { listarCoordenadoresProjetos } from "@/actions/projetos/listar-coordenadores-projetos";
import { listarFinanciadores } from "@/actions/projetos/listar-financiadores";
import { listarProjetos } from "@/actions/projetos/listar-projetos";
import { listarRubricasGlobais } from "@/actions/projetos/listar-rubricas-globais";
import { ProjetosPageClient } from "@/components/projetos/projetos-page-client";
import { podeAdministrarProjetos } from "@/lib/auth/projetos-permissions";
import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { buscarUsuarioPorId } from "@/repositories/usuarios/buscarUsuarioPorId";
import type {
  ProjetoListItem,
  ProjetosDashboardResumo,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export default async function ProjetosPage() {
  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const usuarioInterno = user ? await buscarUsuarioPorId(user.id) : null;

  const podeEditar = podeAdministrarProjetos(
    usuarioInterno
      ? {
          id: usuarioInterno.id,
          perfil: usuarioInterno.perfil,
          status: usuarioInterno.status,
        }
      : null,
  );

  const [
    resultadoProjetos,
    resultadoDashboard,
    resultadoCoordenadores,
    resultadoFinanciadores,
    resultadoRubricasGlobais,
  ] = await Promise.all([
    listarProjetos({
      ordenacao: "data_inicio",
    }),
    buscarDashboardProjetos(),
    listarCoordenadoresProjetos(),
    listarFinanciadores(),
    listarRubricasGlobais(),
  ]);

  return (
    <ProjetosPageClient
      resultadoProjetos={
        resultadoProjetos as ResultadoOperacaoProjeto<ProjetoListItem[]>
      }
      resultadoDashboard={
        resultadoDashboard as ResultadoOperacaoProjeto<ProjetosDashboardResumo>
      }
      coordenadores={resultadoCoordenadores.data ?? []}
      financiadores={resultadoFinanciadores.data ?? []}
      rubricasGlobais={resultadoRubricasGlobais.data ?? []}
      podeEditar={podeEditar}
    />
  );
}