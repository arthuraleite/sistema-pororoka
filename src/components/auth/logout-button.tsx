"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteSupabaseNavegador } from "@/lib/supabase/navegador";

type PropriedadesLogoutButton = {
  className?: string;
};

export function LogoutButton({ className }: PropriedadesLogoutButton) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleLogout() {
    try {
      setSaindo(true);

      const supabase = criarClienteSupabaseNavegador();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao sair:", error.message);
        setSaindo(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro inesperado ao sair:", error);
      setSaindo(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={saindo}
      className={[
        "rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60",
        className ?? "",
      ].join(" ")}
    >
      {saindo ? "Saindo..." : "Sair"}
    </button>
  );
}