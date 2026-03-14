"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TarefasError({ error, reset }: Props) {
  return (
    <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-6">
      <h2 className="text-lg font-semibold text-red-100">
        Não foi possível carregar o módulo de Tarefas
      </h2>

      <p className="mt-2 text-sm text-red-200/80">
        {error.message || "Ocorreu um erro inesperado ao carregar a página."}
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl border border-red-800 bg-red-900/40 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-900/60"
      >
        Tentar novamente
      </button>
    </div>
  );
}