type PropriedadesPainelBoasVindas = {
  nome?: string | null;
};

export function PainelBoasVindas({
  nome,
}: PropriedadesPainelBoasVindas) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-400">Bem-vindo</p>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
        {nome ? `Olá, ${nome}` : "Olá"}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
        Esta é a base inicial do sistema interno da Associação Pororoka.
        A próxima etapa é consolidar usuários, equipes, tarefas, projetos,
        financeiro e espaços mantendo autenticação, permissões e tema escuro.
      </p>
    </section>
  );
}