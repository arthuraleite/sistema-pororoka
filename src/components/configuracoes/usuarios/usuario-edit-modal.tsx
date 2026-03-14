"use client";

import { useMemo, useState, useTransition } from "react";
import { editarUsuarioAction } from "@/actions/configuracoes/usuarios/editar-usuario";
import type { UsuarioDetalhe } from "@/types/configuracoes/usuarios.types";
import type { EquipeListItem } from "@/types/configuracoes/equipes.types";

type UsuarioEditModalProps = {
  aberta: boolean;
  usuario: UsuarioDetalhe | null;
  equipes: EquipeListItem[];
  onClose: () => void;
  onSuccess?: () => void;
};

type UsuarioEditModalContentProps = {
  usuario: UsuarioDetalhe;
  equipes: EquipeListItem[];
  onClose: () => void;
  onSuccess?: () => void;
};

function UsuarioEditModalContent({
  usuario,
  equipes,
  onClose,
  onSuccess,
}: UsuarioEditModalContentProps) {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [equipeId, setEquipeId] = useState(usuario.equipeId ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const equipesOrdenadas = useMemo(
    () => [...equipes].sort((a, b) => a.nome.localeCompare(b.nome)),
    [equipes],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    startTransition(async () => {
      const response = await editarUsuarioAction({
        id: usuario.id,
        nome,
        email,
        equipeId,
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
      <div className="panel-theme w-full max-w-2xl rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-theme-1 text-lg font-semibold">Editar usuário</h3>
            <p className="text-theme-3 mt-1 text-sm">
              Edição permitida: nome, e-mail e equipe.
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

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-theme-2 mb-2 block text-sm font-medium">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-theme-2 mb-2 block text-sm font-medium">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-theme-2 mb-2 block text-sm font-medium">
              Equipe
            </label>
            <select
              value={equipeId}
              onChange={(e) => setEquipeId(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {equipesOrdenadas.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>
          </div>

          {erro ? (
            <div className="status-danger sm:col-span-2 rounded-xl px-3 py-2 text-sm">
              {erro}
            </div>
          ) : null}

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
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
              {isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsuarioEditModal({
  aberta,
  usuario,
  equipes,
  onClose,
  onSuccess,
}: UsuarioEditModalProps) {
  if (!aberta || !usuario) return null;

  return (
    <UsuarioEditModalContent
      key={usuario.id}
      usuario={usuario}
      equipes={equipes}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}