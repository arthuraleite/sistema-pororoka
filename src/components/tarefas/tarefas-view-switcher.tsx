"use client";

type ViewMode = "kanban" | "table" | "week";

type Props = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

const options: Array<{ value: ViewMode; label: string }> = [
  { value: "kanban", label: "Kanban" },
  { value: "table", label: "Tabela" },
  { value: "week", label: "Calendário" },
];

export function TarefasViewSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex items-end gap-2 overflow-x-auto">
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="relative inline-flex h-11 items-center justify-center whitespace-nowrap rounded-t-2xl px-5 text-sm font-medium transition"
            style={{
              border: `1px solid var(--border)`,
              borderBottomColor: active ? "var(--surface-0)" : "var(--border)",
              backgroundColor: active ? "var(--surface-0)" : "var(--button-neutral)",
              color: active ? "var(--text-1)" : "var(--text-3)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
