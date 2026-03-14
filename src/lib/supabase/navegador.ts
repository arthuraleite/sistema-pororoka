import { createBrowserClient } from "@supabase/ssr";

export function criarClienteSupabaseNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variáveis públicas do Supabase não carregadas no navegador."
    );
  }

  return createBrowserClient(url, key);
}