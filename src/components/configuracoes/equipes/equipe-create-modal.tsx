"use client";

import { useState, useTransition } from "react";
import { cadastrarEquipeAction } from "@/actions/configuracoes/equipes/cadastrar-equipe";

type EquipeCreateModalProps = {
  aberta: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function EquipeCreateModal({
  aberta,
  onClose,
  onSuccess,
}: EquipeCreateModalProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!aberta) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    startTransition(async () => {
      const response = await cadastrarEquipeAction({
        nome,
        descricao,
      });

      if (!response.sucesso) {
        setErro(response.erro);
        return;
      }

      setNome("");
      setDescricao("");
      onClose();
      onSuccess?.();
    });
  }

  return (
    <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="panel-theme w-full max-w-lg rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-theme-1 text-lg font-semibold">Nova equipe</h3>
            <p className="text-theme-3 mt-1 text-sm">
              Cadastro de equipe fixa do sistema.
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
              placeholder="Ex.: Financeiro"
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
              placeholder="Descrição opcional da equipe"
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
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}