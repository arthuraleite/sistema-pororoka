"use client";

import type { UsuarioResumoTarefa } from "@/types/tarefas/tarefas.types";

type Props = {
  usuarios: UsuarioResumoTarefa[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
};

export function TarefaResponsaveisField({
  usuarios,
  value,
  onChange,
  disabled = false,
}: Props) {
  function toggle(usuarioId: string) {
    if (disabled) return;

    if (value.includes(usuarioId)) {
      const proximo = value.filter((id) => id !== usuarioId);

      if (proximo.length === 0) return;
      onChange(proximo);
      return;
    }

    onChange([...value, usuarioId]);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Responsáveis</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Selecione ao menos um responsável para a tarefa.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {usuarios.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-3 text-sm text-zinc-500">
            Nenhum usuário disponível.
          </div>
        ) : null}

        {usuarios.map((usuario) => {
          const ativo = value.includes(usuario.id);

          return (
            <button
              key={usuario.id}
              type="button"
              onClick={() => toggle(usuario.id)}
              disabled={disabled}
              className={[
                "rounded-xl border p-3 text-left transition",
                ativo
                  ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                  : "border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:border-zinc-700",
                disabled ? "opacity-50" : "",
              ].join(" ")}
            >
              <div className="text-sm font-medium">{usuario.nome}</div>
              <div
                className={[
                  "mt-1 text-xs",
                  ativo ? "text-zinc-700" : "text-zinc-500",
                ].join(" ")}
              >
                {usuario.email}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}