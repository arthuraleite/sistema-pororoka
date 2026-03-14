import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";
import { verificarAcessoUsuario } from "@/services/auth/verificarAcessoUsuario";
import { AppShell } from "@/components/layout/app-shell";

type PropriedadesLayoutPrivado = {
  children: ReactNode;
};

export default async function LayoutPrivado({
  children,
}: PropriedadesLayoutPrivado) {
  const supabase = await criarClienteSupabaseServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const acesso = await verificarAcessoUsuario(user.id);

  if (!acesso.permitido) {
    await supabase.auth.signOut();

    if (acesso.motivo === "inativo") {
      redirect("/login?erro=inativo");
    }

    if (acesso.motivo === "nao_cadastrado") {
      redirect("/login?erro=sem_acesso");
    }

    redirect("/login?erro=sem_acesso");
  }

  return (
    <AppShell
      nomeUsuario={
        user.user_metadata?.name ?? user.user_metadata?.full_name ?? null
      }
      emailUsuario={user.email ?? null}
      avatarUrl={user.user_metadata?.avatar_url ?? null}
    >
      {children}
    </AppShell>
  );
}