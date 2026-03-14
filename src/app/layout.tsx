import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema Pororoka",
  description: "Sistema interno da Associação Pororoka",
};

type PropriedadesLayoutRaiz = {
  children: React.ReactNode;
};

export default function LayoutRaiz({ children }: PropriedadesLayoutRaiz) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}