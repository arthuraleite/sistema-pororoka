"use client";

import { useState, useTransition } from "react";
import { alterarPerfilUsuarioAction } from "@/actions/configuracoes/usuarios/alterar-perfil-usuario";
import type { PerfilUsuario, UsuarioDetalhe } from "@/types/configuracoes/usuarios.types";

const PERFIS: PerfilUsuario[] = [
  "admin_supremo",
  "coordenador_geral",
  "gestor_financeiro",
  "coordenador_equipe",
  "assistente",
  "membro",
  "analista_financeiro",
];

type UsuarioPerfilModalProps = {
  aberta: boolean;
  usuario: UsuarioDetalhe | null;
  onClose: () => void;
  onSuccess?: () => void;
};

type UsuarioPerfilModalContentProps = {
  usuario: UsuarioDetalhe;
  onClose: () => void;
  onSuccess?: () => void;
};

function UsuarioPerfilModalContent({
  usuario,
  onClose,
  onSuccess,
}: UsuarioPerfilModalContentProps) {
  const [novoPerfil, setNovoPerfil] = useState<PerfilUsuario>(usuario.perfil);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    startTransition(async () => {
      const response = await alterarPerfilUsuarioAction({
        id: usuario.id,
        novoPerfil,
      });

      if (!response.sucesso) {
        setErro(response.erro);
        return;
      }

      onClose();
      onSuccess?.();
    });
  }

  return (
    <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="panel-theme w-full max-w-lg rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-theme-1 text-lg font-semibold">
              Alterar perfil
            </h3>
            <p className="text-theme-3 mt-1 text-sm">
              Defina o perfil institucional do usuário.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="button-neutral rounded-lg px-3 py-1.5 text-xs"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <p className="text-theme-2 text-sm">
              <span className="text-theme-1 font-medium">Usuário:</span>{" "}
              {usuario.nome}
            </p>
            <p className="text-theme-3 mt-1 text-sm">{usuario.email}</p>
          </div>

          <div>
            <label className="text-theme-2 mb-2 block text-sm font-medium">
              Novo perfil
            </label>
            <select
              value={novoPerfil}
              onChange={(e) => setNovoPerfil(e.target.value as PerfilUsuario)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            >
              {PERFIS.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {perfil}
                </option>
              ))}
            </select>
          </div>

          {erro ? (
            <div className="status-danger rounded-xl px-3 py-2 text-sm">
              {erro}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="button-neutral rounded-xl px-4 py-2 text-sm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="button-primary rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {isPending ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsuarioPerfilModal({
  aberta,
  usuario,
  onClose,
  onSuccess,
}: UsuarioPerfilModalProps) {
  if (!aberta || !usuario) return null;

  return (
    <UsuarioPerfilModalContent
      key={usuario.id}
      usuario={usuario}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}