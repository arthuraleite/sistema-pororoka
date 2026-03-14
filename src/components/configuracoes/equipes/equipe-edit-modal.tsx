"use client";

import { useState, useTransition } from "react";
import { editarEquipeAction } from "@/actions/configuracoes/equipes/editar-equipe";
import type { EquipeDetalhe } from "@/types/configuracoes/equipes.types";

type EquipeEditModalProps = {
  aberta: boolean;
  equipe: EquipeDetalhe | null;
  onClose: () => void;
  onSuccess?: () => void;
};

type EquipeEditModalContentProps = {
  equipe: EquipeDetalhe;
  onClose: () => void;
  onSuccess?: () => void;
};

function EquipeEditModalContent({
  equipe,
  onClose,
  onSuccess,
}: EquipeEditModalContentProps) {
  const [nome, setNome] = useState(equipe.nome);
  const [descricao, setDescricao] = useState(equipe.descricao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const equipeId = equipe.id;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    startTransition(async () => {
      const response = await editarEquipeAction({
        id: equipeId,
        nome,
        descricao,
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
            <h3 className="text-theme-1 text-lg font-semibold">Editar equipe</h3>
            <p className="text-theme-3 mt-1 text-sm">
              Atualização de dados institucionais da equipe.
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
            <label className="text-theme-2 mb-2 block text-sm font-medium">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-theme-2 mb-2 block text-sm font-medium">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              className="w-full rounded-xl px-3 py-2 text-sm"
            />
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
              {isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EquipeEditModal({
  aberta,
  equipe,
  onClose,
  onSuccess,
}: EquipeEditModalProps) {
  if (!aberta || !equipe) return null;

  return (
    <EquipeEditModalContent
      key={equipe.id}
      equipe={equipe}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}