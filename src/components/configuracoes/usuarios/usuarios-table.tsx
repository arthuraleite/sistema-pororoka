"use client";

import type { UsuarioListItem } from "@/types/configuracoes/usuarios.types";

type UsuariosTableProps = {
  usuarios: UsuarioListItem[];
  podeEditar: boolean;
  podeAlterarPerfil: boolean;
  podeInativar: boolean;
  podeReativar: boolean;
  onVisualizar: (id: string) => void;
  onEditar: (id: string) => void;
  onAlterarPerfil: (id: string) => void;
  onInativar: (id: string) => void;
  onReativar: (id: string) => void;
};

export function UsuariosTable({
  usuarios,
  podeEditar,
  podeAlterarPerfil,
  podeInativar,
  podeReativar,
  onVisualizar,
  onEditar,
  onAlterarPerfil,
  onInativar,
  onReativar,
}: UsuariosTableProps) {
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
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">
                Perfil
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">
                Equipe
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em]">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="table-empty px-4 py-8 text-center text-sm"
                >
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className="border-theme border-b">
                  <td className="table-text-primary px-4 py-4 text-sm font-medium">
                    {usuario.nome}
                  </td>
                  <td className="table-text-secondary px-4 py-4 text-sm">
                    {usuario.email}
                  </td>
                  <td className="table-text-secondary px-4 py-4 text-sm">
                    {usuario.perfil}
                  </td>
                  <td className="table-text-secondary px-4 py-4 text-sm">
                    {usuario.equipeNome || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        usuario.status === "ativo"
                          ? "badge-success"
                          : "badge-neutral",
                      ].join(" ")}
                    >
                      {usuario.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onVisualizar(usuario.id)}
                        className="button-neutral rounded-lg px-3 py-1.5 text-xs font-medium"
                      >
                        Visualizar
                      </button>

                      {podeEditar ? (
                        <button
                          type="button"
                          onClick={() => onEditar(usuario.id)}
                          className="button-neutral rounded-lg px-3 py-1.5 text-xs font-medium"
                        >
                          Editar
                        </button>
                      ) : null}

                      {podeAlterarPerfil ? (
                        <button
                          type="button"
                          onClick={() => onAlterarPerfil(usuario.id)}
                          className="button-neutral rounded-lg px-3 py-1.5 text-xs font-medium"
                        >
                          Perfil
                        </button>
                      ) : null}

                      {usuario.status === "ativo" && podeInativar ? (
                        <button
                          type="button"
                          onClick={() => onInativar(usuario.id)}
                          className="button-neutral rounded-lg px-3 py-1.5 text-xs font-medium"
                        >
                          Inativar
                        </button>
                      ) : null}

                      {usuario.status === "inativo" && podeReativar ? (
                        <button
                          type="button"
                          onClick={() => onReativar(usuario.id)}
                          className="button-neutral rounded-lg px-3 py-1.5 text-xs font-medium"
                        >
                          Reativar
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