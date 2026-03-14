import { NextResponse, type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

const ROTAS_PUBLICAS = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const response = await atualizarSessao(request);

  const caminho = request.nextUrl.pathname;
  const rotaPublica = ROTAS_PUBLICAS.some((rota) => caminho.startsWith(rota));

  const supabase = response.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !rotaPublica) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && caminho === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response.nextResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};