"use client";

type AtualizacaoItem = {
  id: string;
  descricao: string;
  criadoEm: string;
};

type Props = {
  itens: AtualizacaoItem[];
  vazioLabel?: string;
};

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export function TarefaAtualizacoesPanel({
  itens,
  vazioLabel = "Nenhuma atualização registrada até o momento.",
}: Props) {
  return (
    <section className="space-y-3">
      {itens.length === 0 ? (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            border: "1px dashed var(--border)",
            backgroundColor: "var(--surface-0)",
            color: "var(--text-3)",
          }}
        >
          {vazioLabel}
        </div>
      ) : null}

      <div className="space-y-3">
        {itens.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl p-4"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface-0)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: "var(--accent-2)" }}
              />

              <div className="min-w-0 flex-1">
                <p
                  className="text-sm leading-6"
                  style={{ color: "var(--text-2)" }}
                >
                  {item.descricao}
                </p>

                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--text-4)" }}
                >
                  {formatarDataHora(item.criadoEm)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}