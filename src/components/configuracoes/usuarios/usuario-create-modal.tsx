"use client";

import { useMemo, useState, useTransition } from "react";
import { cadastrarUsuarioAction } from "@/actions/configuracoes/usuarios/cadastrar-usuario"
import type { EquipeListItem } from "@/types/configuracoes/equipes.types";

const PERFIS = [
  "admin_supremo",
  "coordenador_geral",
  "gestor_financeiro",
  "coordenador_equipe",
  "assistente",
  "membro",
  "analista_financeiro",
] as const;

type UsuarioCreateModalProps = {
  aberta: boolean;
  equipes: EquipeListItem[];
  onClose: () => void;
  onSuccess?: () => void;
};

export function UsuarioCreateModal({
  aberta,
  equipes,
  onClose,
  onSuccess,
}: UsuarioCreateModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<(typeof PERFIS)[number]>("membro");
  const [equipeId, setEquipeId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const equipesOrdenadas = useMemo(
    () => [...equipes].sort((a, b) => a.nome.localeCompare(b.nome)),
    [equipes],
  );

  if (!aberta) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    startTransition(async () => {
      const response = await cadastrarUsuarioAction({
        nome,
        email,
        perfil,
        equipeId,
      });

      if (!response.sucesso) {
        setErro(response.erro);
        return;
      }

      setNome("");
      setEmail("");
      setPerfil("membro");
      setEquipeId("");
      onClose();
      onSuccess?.();
    });
  }

  return (
    <div className="overlay-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="panel-theme w-full max-w-2xl rounded-[var(--radius-2xl)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-theme-1 text-lg font-semibold">Novo usuário</h3>
            <p className="text-theme-3 mt-1 text-sm">
              O usuário será criado no Auth e em usuários com senha inicial 1234.
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

          <div>
            <label className="text-theme-2 mb-2 block text-sm font-medium">
              Perfil
            </label>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as (typeof PERFIS)[number])}
              className="w-full rounded-xl px-3 py-2 text-sm"
            >
              {PERFIS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
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
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}