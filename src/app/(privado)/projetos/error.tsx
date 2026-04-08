"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorProjetosPage({ error, reset }: Props) {
  return (
    <div
      className="rounded-[var(--radius-2xl)] p-6"
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid #6b2328",
      }}
    >
      <h2
        className="text-lg font-semibold"
        style={{ color: "#fecaca" }}
      >
        Não foi possível carregar o módulo de projetos
      </h2>

      <p className="mt-3 text-sm leading-6" style={{ color: "#fca5a5" }}>
        {error.message || "Ocorreu um erro inesperado ao carregar esta área."}
      </p>

      <div className="mt-5">
        <button
          type="button"
          onClick={reset}
          className="button-neutral inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}