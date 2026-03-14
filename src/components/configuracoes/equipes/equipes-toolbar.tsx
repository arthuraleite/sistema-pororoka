"use client";

type EquipesToolbarProps = {
  podeCadastrar: boolean;
  onCadastrar: () => void;
  busca: string;
  onBuscaChange: (value: string) => void;
};

export function EquipesToolbar({
  podeCadastrar,
  onCadastrar,
  busca,
  onBuscaChange,
}: EquipesToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-heading-title text-lg font-semibold">Equipes</h2>
          <p className="section-heading-description text-sm">
            Gerencie as equipes fixas disponíveis no sistema.
          </p>
        </div>

        {podeCadastrar ? (
          <button
            type="button"
            onClick={onCadastrar}
            className="button-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium"
          >
            Nova equipe
          </button>
        ) : null}
      </div>

      <input
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        placeholder="Buscar por nome ou descrição"
        className="w-full rounded-xl px-3 py-2 text-sm"
      />
    </div>
  );
}