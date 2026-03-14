import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteSupabaseServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaDefinir) {
          try {
            cookiesParaDefinir.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignora em contextos sem permissão de escrita de cookie.
          }
        },
      },
    }
  );
}