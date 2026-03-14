"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";

export async function logout() {
  const supabase = await criarClienteSupabaseServidor();
  await supabase.auth.signOut();
  redirect("/login");
}