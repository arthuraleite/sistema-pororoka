"use client";

import Image from "next/image";
import { Check, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { UsuarioResumoTarefa } from "@/types/tarefas/tarefas.types";

type Props = {
  usuarios: UsuarioResumoTarefa[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  minCount?: number;
};

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function Avatar({
  nome,
  avatarUrl,
  size = "sm",
}: {
  nome: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "h-8 w-8 text-xs" : "h-7 w-7 text-[10px]";

  if (avatarUrl) {
    return (
      <span className={`relative overflow-hidden rounded-full ${sizeClass}`}>
        <Image
          src={avatarUrl}
          alt={nome}
          fill
          className="object-cover"
          sizes={size === "md" ? "32px" : "28px"}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex ${sizeClass} items-center justify-center rounded-full font-semibold`}
      style={{
        backgroundColor: "var(--surface-3)",
        color: "var(--text-2)",
        border: "1px solid var(--border)",
      }}
    >
      {iniciais(nome)}
    </span>
  );
}

function formatarNomeCurto(nome?: string | null) {
  if (!nome) return "Usuário";

  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];

  return `${partes[0]} ${partes[1]}`;
}

export function TarefaResponsaveisField({
  usuarios,
  value,
  onChange,
  disabled = false,
  label = "Responsáveis",
  description = "Selecione ao menos um responsável.",
  minCount = 1,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setBusca("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selecionados = useMemo(
    () => usuarios.filter((usuario) => value.includes(usuario.id)),
    [usuarios, value],
  );

  const termo = busca.trim().toLowerCase();

  const selecionadosFiltrados = useMemo(() => {
    if (!termo) return selecionados;

    return selecionados.filter(
      (usuario) =>
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo),
    );
  }, [selecionados, termo]);

  const disponiveisFiltrados = useMemo(() => {
    return usuarios
      .filter((usuario) => !value.includes(usuario.id))
      .filter((usuario) => {
        if (!termo) return true;

        return (
          usuario.nome.toLowerCase().includes(termo) ||
          usuario.email.toLowerCase().includes(termo)
        );
      });
  }, [usuarios, value, termo]);

  function adicionar(usuarioId: string) {
    if (disabled) return;
    if (value.includes(usuarioId)) return;

    onChange([...value, usuarioId]);
  }

  function remover(usuarioId: string) {
    if (disabled) return;

    const proximo = value.filter((id) => id !== usuarioId);

    if (proximo.length < minCount) {
      return;
    }

    onChange(proximo);
  }

  function toggle(usuarioId: string) {
    if (value.includes(usuarioId)) {
      remover(usuarioId);
      return;
    }

    adicionar(usuarioId);
  }

  return (
    <div
      ref={containerRef}
      className="rounded-[24px] p-4 md:p-5"
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
            {label}
            <span style={{ color: "var(--danger)" }}> *</span>
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-4)" }}>
            {description}
          </p>
        </div>

        <div className="relative overflow-visible">
          <button
            type="button"
            onClick={() => !disabled && setOpen((current) => !current)}
            disabled={disabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition"
            style={{
              backgroundColor: "var(--surface-0)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{open ? "Fechar" : "Adicionar"}</span>
          </button>

          {open ? (
            <div
              className="absolute bottom-full right-0 z-40 mb-2 w-[min(96vw,720px)] overflow-hidden rounded-2xl"
              style={{
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <div
                className="flex items-center justify-between gap-3 px-3 py-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <h4
                    className="text-sm font-medium"
                    style={{ color: "var(--text-1)" }}
                  >
                    Selecionar responsáveis
                  </h4>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-4)" }}>
                    {selecionados.length} selecionado(s)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setBusca("");
                  }}
                  className="text-xs font-medium transition"
                  style={{ color: "var(--text-4)" }}
                >
                  Fechar
                </button>
              </div>

              <div className="max-h-[300px] space-y-2 overflow-y-auto p-2.5">
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Search className="h-4 w-4" style={{ color: "var(--text-4)" }} />
                  <input
                    type="text"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar por nome ou email"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: "var(--text-1)" }}
                  />
                </div>

                {selecionadosFiltrados.length > 0 ? (
                  <div className="space-y-1.5">
                    <div
                      className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Selecionados
                    </div>

                    <div className="space-y-1">
                      {selecionadosFiltrados.map((usuario) => (
                        <button
                          key={usuario.id}
                          type="button"
                          onClick={() => toggle(usuario.id)}
                          className="interactive-surface flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left transition"
                        >
                          <Avatar
                            nome={usuario.nome}
                            avatarUrl={usuario.avatarUrl}
                            size="md"
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-sm"
                              style={{ color: "var(--text-1)" }}
                            >
                              {usuario.nome}
                            </span>
                            <span
                              className="block truncate text-xs"
                              style={{ color: "var(--text-4)" }}
                            >
                              {usuario.email}
                            </span>
                          </span>

                          <Check
                            className="h-4 w-4 shrink-0"
                            style={{ color: "var(--text-3)" }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {disponiveisFiltrados.length > 0 ? (
                  <div className="space-y-1.5">
                    <div
                      className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--text-4)" }}
                    >
                      Usuários
                    </div>

                    <div className="space-y-1">
                      {disponiveisFiltrados.map((usuario) => (
                        <button
                          key={usuario.id}
                          type="button"
                          onClick={() => adicionar(usuario.id)}
                          className="interactive-surface flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left transition"
                        >
                          <Avatar
                            nome={usuario.nome}
                            avatarUrl={usuario.avatarUrl}
                            size="md"
                          />
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-sm"
                              style={{ color: "var(--text-1)" }}
                            >
                              {usuario.nome}
                            </span>
                            <span
                              className="block truncate text-xs"
                              style={{ color: "var(--text-4)" }}
                            >
                              {usuario.email}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selecionadosFiltrados.length === 0 &&
                disponiveisFiltrados.length === 0 ? (
                  <div
                    className="rounded-2xl border border-dashed px-4 py-3 text-sm"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface-1)",
                      color: "var(--text-4)",
                    }}
                  >
                    Nenhum usuário encontrado.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {selecionados.length > 0 ? (
          selecionados.map((usuario) => (
            <div
              key={usuario.id}
              className="inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2"
              style={{
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
              }}
            >
              <Avatar nome={usuario.nome} avatarUrl={usuario.avatarUrl} size="sm" />

              <span
                className="max-w-[180px] truncate text-sm"
                style={{ color: "var(--text-2)" }}
                title={usuario.nome}
              >
                {formatarNomeCurto(usuario.nome)}
              </span>

              {!disabled ? (
                <button
                  type="button"
                  onClick={() => remover(usuario.id)}
                  className="transition"
                  style={{ color: "var(--text-4)" }}
                  aria-label={`Remover ${usuario.nome}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div
            className="rounded-2xl border border-dashed px-4 py-3 text-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-0)",
              color: "var(--text-4)",
            }}
          >
            Nenhum responsável selecionado.
          </div>
        )}
      </div>
    </div>
  );
}