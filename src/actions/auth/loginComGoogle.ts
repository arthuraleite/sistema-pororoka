"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";

export async function loginComGoogle() {
  const supabase = await criarClienteSupabaseServidor();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000/auth/callback",
    },
  });

  if (error) {
    throw new Error("Não foi possível iniciar o login com Google.");
  }

  if (!data.url) {
    throw new Error("Não foi possível obter a URL de autenticação.");
  }

  redirect(data.url);
}