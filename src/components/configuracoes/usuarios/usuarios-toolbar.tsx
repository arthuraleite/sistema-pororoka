"use client";

import type { EquipeListItem } from "@/types/configuracoes/equipes.types";
import type { PerfilUsuario, StatusUsuario } from "@/types/configuracoes/usuarios.types";

const PERFIS: PerfilUsuario[] = [
  "admin_supremo",
  "coordenador_geral",
  "gestor_financeiro",
  "coordenador_equipe",
  "assistente",
  "membro",
  "analista_financeiro",
];

const STATUS: StatusUsuario[] = ["ativo", "inativo"];

type UsuariosToolbarProps = {
  podeCadastrar: boolean;
  onCadastrar: () => void;
  busca: string;
  onBuscaChange: (value: string) => void;
  perfil: string;
  onPerfilChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  equipeId: string;
  onEquipeChange: (value: string) => void;
  equipes: EquipeListItem[];
};

export function UsuariosToolbar({
  podeCadastrar,
  onCadastrar,
  busca,
  onBuscaChange,
  perfil,
  onPerfilChange,
  status,
  onStatusChange,
  equipeId,
  onEquipeChange,
  equipes,
}: UsuariosToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-heading-title text-lg font-semibold">Usuários</h2>
          <p className="section-heading-description text-sm">
            Gerencie usuários, perfis, equipes e status do sistema.
          </p>
        </div>

        {podeCadastrar ? (
          <button
            type="button"
            onClick={onCadastrar}
            className="button-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium"
          >
            Novo usuário
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          className="w-full rounded-xl px-3 py-2 text-sm"
        />

        <select
          value={perfil}
          onChange={(e) => onPerfilChange(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Todos os perfis</option>
          {PERFIS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {STATUS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={equipeId}
          onChange={(e) => onEquipeChange(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Todas as equipes</option>
          {equipes.map((equipe) => (
            <option key={equipe.id} value={equipe.id}>
              {equipe.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}