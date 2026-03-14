"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";

export async function loginComSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "").trim();

  if (!email || !senha) {
    redirect("/login?erro=credenciais_obrigatorias");
  }

  const supabase = await criarClienteSupabaseServidor();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    console.error("Erro de login Supabase:", {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });

    redirect("/login?erro=credenciais_invalidas");
  }

  redirect("/dashboard");
}