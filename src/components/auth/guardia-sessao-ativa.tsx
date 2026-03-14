"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { verificarSessaoAtivaAction } from "@/actions/auth/verificar-sessao-ativa";
import { criarClienteSupabaseNavegador } from "@/lib/supabase/navegador";

const INTERVALO_VERIFICACAO_MS = 15000;

export function GuardiaSessaoAtiva() {
  const router = useRouter();
  const bloqueandoRef = useRef(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let cancelado = false;

    async function verificar() {
      if (bloqueandoRef.current || cancelado) return;

      const resposta = await verificarSessaoAtivaAction();

      if (resposta.permitido) return;

      bloqueandoRef.current = true;

      const supabase = criarClienteSupabaseNavegador();
      await supabase.auth.signOut();

      if (cancelado) return;

      if (resposta.motivo === "inativo") {
        router.replace("/login?erro=inativo");
        router.refresh();
        return;
      }

      router.replace("/login?erro=sem_acesso");
      router.refresh();
    }

    void verificar();
    intervalId = setInterval(() => {
      void verificar();
    }, INTERVALO_VERIFICACAO_MS);

    return () => {
      cancelado = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [router]);

  return null;
}