"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

type PropriedadesHeaderInterno = {
  nomeUsuario?: string | null;
  emailUsuario?: string | null;
  avatarUrl?: string | null;
};

export function HeaderInterno({
  nomeUsuario,
  emailUsuario,
  avatarUrl,
}: PropriedadesHeaderInterno) {
  const [aberto, setAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickFora);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const iniciais = (nomeUsuario || emailUsuario || "U")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return (
    <header className="header-theme">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="header-title text-lg font-semibold">
            Sistema Interno de Gestão da Pororoka
          </h1>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setAberto((valorAtual) => !valorAtual)}
            className="interactive-surface flex items-center gap-3 rounded-full border border-transparent px-2 py-1"
            aria-haspopup="menu"
            aria-expanded={aberto}
            aria-label="Abrir menu do usuário"
          >
            <div className="hidden text-right sm:block">
              <p className="text-theme-1 max-w-[180px] truncate text-sm font-medium">
                {nomeUsuario || "Área interna"}
              </p>
            </div>

            <div className="bg-theme-card border-theme-strong relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border text-sm font-semibold">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={nomeUsuario || "Usuário"}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <span className="text-theme-2">{iniciais || "U"}</span>
              )}
            </div>
          </button>

          {aberto ? (
            <div className="panel-theme absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl">
              <div className="border-theme border-b px-4 py-4">
                <p className="detail-value-primary truncate text-sm font-semibold">
                  {nomeUsuario || "Área interna"}
                </p>
                {emailUsuario ? (
                  <p className="detail-value-secondary mt-1 truncate text-sm">
                    {emailUsuario}
                  </p>
                ) : null}
              </div>

              <div className="p-2">
                <LogoutButton className="button-neutral w-full justify-start rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}