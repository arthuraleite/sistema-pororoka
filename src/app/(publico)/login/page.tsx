import { loginComSenha } from "@/actions/auth/loginComSenha";
// import { logout } from "@/actions/auth/logout";
import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { verificarAcessoUsuario } from "@/services/auth/verificarAcessoUsuario";
import { redirect } from "next/navigation";

type PropriedadesPaginaLogin = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

function obterMensagemErro(erro?: string) {
  switch (erro) {
    case "credenciais_obrigatorias":
      return "Informe e-mail e senha para entrar.";
    case "credenciais_invalidas":
      return "E-mail ou senha inválidos.";
    case "sem_acesso":
      return "Seu login foi reconhecido, mas este usuário ainda não tem acesso liberado no sistema.";
    case "inativo":
      return "Seu usuário está inativo. Entre em contato com a administração do sistema.";
    default:
      return null;
  }
}

export default async function PaginaLogin({
  searchParams,
}: PropriedadesPaginaLogin) {
  const parametros = await searchParams;
  const erro = parametros.erro;

  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const acesso = await verificarAcessoUsuario(user.id);

    if (acesso.permitido) {
      redirect("/dashboard");
    }

    await supabase.auth.signOut();
  }

  const mensagemErro = obterMensagemErro(erro);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="panel-theme w-full max-w-md rounded-[var(--radius-2xl)] p-8">
        <div className="mb-6 text-center">
          <h1 className="text-theme-1 text-2xl font-bold">Sistema Pororoka</h1>
          <p className="text-theme-3 mt-2 text-sm">
            Acesse o ambiente local de desenvolvimento.
          </p>
        </div>

        {mensagemErro ? (
          <div className="status-danger mb-4 rounded-xl px-4 py-3 text-sm">
            {mensagemErro}
          </div>
        ) : null}

        <form action={loginComSenha} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-theme-2 mb-1 block text-sm font-medium"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="text-theme-2 mb-1 block text-sm font-medium"
            >
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              className="w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="button-primary w-full rounded-xl px-4 py-3 text-sm font-semibold"
          >
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}