"use client";

import type { EquipeListItem } from "@/types/configuracoes/equipes.types";

type EquipesTableProps = {
  equipes: EquipeListItem[];
  podeEditar: boolean;
  onVisualizar: (id: string) => void;
  onEditar: (id: string) => void;
};

export function EquipesTable({
  equipes,
  podeEditar,
  onVisualizar,
  onEditar,
}: EquipesTableProps) {
  return (
    <div className="table-theme overflow-hidden rounded-[var(--radius-2xl)]">
      <div className="overflow-x-auto">
        <table className="table-theme min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">
                Descrição
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {equipes.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="table-empty px-4 py-8 text-center text-sm"
                >
                  Nenhuma equipe cadastrada.
                </td>
              </tr>
            ) : (
              equipes.map((equipe) => (
                <tr className="border-theme border-b"
                key={equipe.id}>
                  
                  <td className="table-text-primary px-4 py-4 text-sm font-medium">
                    {equipe.nome}
                  </td>
                  <td className="table-text-secondary px-4 py-4 text-sm">
                    {equipe.descricao || "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onVisualizar(equipe.id)}
                        className="button-neutral rounded-lg px-3 py-1.5 text-xs font-medium"
                      >
                        Visualizar
                      </button>

                      {podeEditar ? (
                        <button
                          type="button"
                          onClick={() => onEditar(equipe.id)}
                          className="button-neutral rounded-lg px-3 py-1.5 text-xs font-medium"
                        >
                          Editar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}