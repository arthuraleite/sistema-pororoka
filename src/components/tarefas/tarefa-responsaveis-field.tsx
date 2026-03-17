"use client";

import Image from "next/image";
import { Plus, Search, X } from "lucide-react";
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
  size = "md",
}: {
  nome: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-[10px]" : "h-9 w-9 text-xs";

  if (avatarUrl) {
    return (
      <span className={`relative overflow-hidden rounded-full ${sizeClass}`}>
        <Image
          src={avatarUrl}
          alt={nome}
          fill
          className="object-cover"
          sizes={size === "sm" ? "32px" : "36px"}
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
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {selecionados.length > 0 ? (
          selecionados.map((usuario) => (
            <button
              key={usuario.id}
              type="button"
              onClick={() => remover(usuario.id)}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 transition"
              style={{
                backgroundColor: "var(--surface-0)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
              title={
                disabled
                  ? usuario.nome
                  : minCount === 1 && value.length <= 1
                    ? `${usuario.nome} (ao menos um responsável é obrigatório)`
                    : `Remover ${usuario.nome}`
              }
            >
              <Avatar nome={usuario.nome} avatarUrl={usuario.avatarUrl} size="sm" />
              <span className="max-w-[140px] truncate text-sm">
                {formatarNomeCurto(usuario.nome)}
              </span>
              {!disabled ? (
                <X className="h-3.5 w-3.5" style={{ color: "var(--text-4)" }} />
              ) : null}
            </button>
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

        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition"
          style={{
            backgroundColor: "var(--surface-0)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar</span>
        </button>
      </div>

      {open ? (
        <div
          className="mt-4 overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "var(--surface-0)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
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

          <div className="max-h-72 overflow-y-auto p-2">
            {selecionadosFiltrados.length > 0 ? (
              <>
                <div
                  className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--text-4)" }}
                >
                  Selecionados
                </div>

                <div className="space-y-1 pb-2">
                  {selecionadosFiltrados.map((usuario) => (
                    <button
                      key={usuario.id}
                      type="button"
                      onClick={() => toggle(usuario.id)}
                      className="interactive-surface flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
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
                      <span
                        className="rounded-full px-2 py-1 text-[11px] font-medium"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          color: "var(--text-3)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        Selecionado
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {disponiveisFiltrados.length > 0 ? (
              <>
                <div
                  className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--text-4)" }}
                >
                  Disponíveis
                </div>

                <div className="space-y-1">
                  {disponiveisFiltrados.map((usuario) => (
                    <button
                      key={usuario.id}
                      type="button"
                      onClick={() => adicionar(usuario.id)}
                      className="interactive-surface flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
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
              </>
            ) : null}

            {selecionadosFiltrados.length === 0 && disponiveisFiltrados.length === 0 ? (
              <div
                className="px-3 py-4 text-sm"
                style={{ color: "var(--text-4)" }}
              >
                Nenhum usuário encontrado.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}