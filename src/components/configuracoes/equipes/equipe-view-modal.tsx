"use client";

import type { EquipeDetalhe } from "@/types/configuracoes/equipes.types";

type EquipeViewModalProps = {
  aberta: boolean;
  equipe: EquipeDetalhe | null;
  onClose: () => void;
};

export function EquipeViewModal({
  aberta,
  equipe,
  onClose,
}: EquipeViewModalProps) {
  if (!aberta || !equipe) return null;

  return (
    <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="panel-theme w-full max-w-lg rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-theme-1 text-lg font-semibold">
              Detalhes da equipe
            </h3>
            <p className="text-theme-3 mt-1 text-sm">
              Visualização institucional da equipe.
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

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-theme-4 text-xs font-semibold uppercase tracking-[0.18em]">
              Nome
            </p>
            <p className="text-theme-1 mt-1 text-sm">{equipe.nome}</p>
          </div>

          <div>
            <p className="text-theme-4 text-xs font-semibold uppercase tracking-[0.18em]">
              Descrição
            </p>
            <p className="text-theme-2 mt-1 text-sm">{equipe.descricao || "—"}</p>
          </div>

          <div>
            <p className="text-theme-4 text-xs font-semibold uppercase tracking-[0.18em]">
              Total de usuários
            </p>
            <p className="text-theme-2 mt-1 text-sm">
              {equipe.totalUsuarios ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}