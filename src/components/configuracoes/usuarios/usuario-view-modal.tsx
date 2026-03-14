"use client";

import type { UsuarioDetalhe } from "@/types/configuracoes/usuarios.types";

type UsuarioViewModalProps = {
  aberta: boolean;
  usuario: UsuarioDetalhe | null;
  onClose: () => void;
};

export function UsuarioViewModal({
  aberta,
  usuario,
  onClose,
}: UsuarioViewModalProps) {
  if (!aberta || !usuario) return null;

  return (
    <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="panel-theme w-full max-w-xl rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-theme-1 text-lg font-semibold">
              Detalhes do usuário
            </h3>
            <p className="text-theme-3 mt-1 text-sm">
              Visualização institucional do usuário.
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="detail-label text-xs font-semibold uppercase tracking-[0.18em]">
              Nome
            </p>
            <p className="detail-value-primary mt-1 text-sm">{usuario.nome}</p>
          </div>

          <div>
            <p className="detail-label text-xs font-semibold uppercase tracking-[0.18em]">
              E-mail
            </p>
            <p className="detail-value-secondary mt-1 text-sm">{usuario.email}</p>
          </div>

          <div>
            <p className="detail-label text-xs font-semibold uppercase tracking-[0.18em]">
              Perfil
            </p>
            <p className="detail-value-secondary mt-1 text-sm">{usuario.perfil}</p>
          </div>

          <div>
            <p className="detail-label text-xs font-semibold uppercase tracking-[0.18em]">
              Status
            </p>
            <p className="detail-value-secondary mt-1 text-sm">{usuario.status}</p>
          </div>

          <div className="sm:col-span-2">
            <p className="detail-label text-xs font-semibold uppercase tracking-[0.18em]">
              Equipe
            </p>
            <p className="detail-value-secondary mt-1 text-sm">
              {usuario.equipeNome || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}