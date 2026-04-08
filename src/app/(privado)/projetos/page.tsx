import { buscarDashboardProjetos } from "@/actions/projetos/buscar-dashboard-projetos";
import { listarProjetos } from "@/actions/projetos/listar-projetos";
import { ProjetosPageClient } from "@/components/projetos/projetos-page-client";
import type {
  ProjetoListItem,
  ProjetosDashboardResumo,
  ResultadoOperacaoProjeto,
} from "@/types/projetos/projetos.types";

export default async function ProjetosPage() {
  const [resultadoProjetos, resultadoDashboard] = await Promise.all([
    listarProjetos({
      ordenacao: "data_inicio",
    }),
    buscarDashboardProjetos(),
  ]);

  return (
    <ProjetosPageClient
      resultadoProjetos={
        resultadoProjetos as ResultadoOperacaoProjeto<ProjetoListItem[]>
      }
      resultadoDashboard={
        resultadoDashboard as ResultadoOperacaoProjeto<ProjetosDashboardResumo>
      }
    />
  );
}