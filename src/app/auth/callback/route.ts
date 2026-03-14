import { NextResponse } from "next/server";
import { criarClienteSupabaseServidor } from "@/lib/supabase/servidor";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await criarClienteSupabaseServidor();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}