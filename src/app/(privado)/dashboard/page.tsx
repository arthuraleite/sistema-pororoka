import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { PainelBoasVindas } from "@/components/dashboard/PainelBoasVindas";
import { CardResumo } from "@/components/dashboard/CardResumo";

export default async function PaginaDashboard() {
  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nomeUsuario =
    user?.user_metadata?.name ??
    user?.user_metadata?.full_name ??
    null;

  return (
    <div className="space-y-6">
      <PainelBoasVindas nome={nomeUsuario} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Usuários"
          valor="—"
          descricao="Módulo ainda em consolidação"
        />
        <CardResumo
          titulo="Equipes"
          valor="—"
          descricao="Estrutura pronta para próxima etapa"
        />
        <CardResumo
          titulo="Tarefas"
          valor="—"
          descricao="Fase seguinte após base institucional"
        />
        <CardResumo
          titulo="Projetos"
          valor="—"
          descricao="Dashboard futuro com indicadores reais"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card-theme rounded-[var(--radius-2xl)] p-5">
          <h3 className="text-theme-1 text-lg font-semibold">
            Próximos passos técnicos
          </h3>
          <div className="text-theme-3 mt-4 space-y-3 text-sm">
            <p>• Formalizar seed institucional inicial</p>
            <p>• Iniciar módulo de usuários</p>
            <p>• Iniciar módulo de equipes</p>
            <p>• Validar policies RLS mínimas</p>
          </div>
        </div>

        <div className="card-theme rounded-[var(--radius-2xl)] p-5">
          <h3 className="text-theme-1 text-lg font-semibold">
            Estado atual
          </h3>
          <div className="text-theme-3 mt-4 space-y-3 text-sm">
            <p>• Login funcionando</p>
            <p>• Logout funcionando</p>
            <p>• Área privada protegida no layout</p>
            <p>• Estrutura pronta para evolução modular</p>
          </div>
        </div>
      </section>
    </div>
  );
}