"use client";

import { useTransition } from "react";
import { reativarUsuarioAction } from "@/actions/configuracoes/usuarios/reativar-usuario";
import type { UsuarioDetalhe } from "@/types/configuracoes/usuarios.types";

type UsuarioReativarModalProps = {
  aberta: boolean;
  usuario: UsuarioDetalhe | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function UsuarioReativarModal({
  aberta,
  usuario,
  onClose,
  onSuccess,
}: UsuarioReativarModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!aberta || !usuario) return null;

  const usuarioId = usuario.id;

  function handleConfirmar() {
    startTransition(async () => {
      const response = await reativarUsuarioAction(usuarioId);

      if (!response.sucesso) return;

      onClose();
      onSuccess?.();
    });
  }

  return (
    <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="panel-theme w-full max-w-lg rounded-[var(--radius-2xl)] p-6">
        <h3 className="text-theme-1 text-lg font-semibold">Reativar usuário</h3>
        <p className="text-theme-3 mt-2 text-sm">
          Tem certeza que deseja reativar{" "}
          <span className="text-theme-1">{usuario.nome}</span>?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="button-neutral rounded-xl px-4 py-2 text-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isPending}
            className="button-success rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {isPending ? "Processando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}