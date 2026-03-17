"use client";

type AtualizacaoItem = {
  id: string;
  descricao: string;
  criadoEm: string;
  autorNome?: string | null;
  titulo?: string | null;
  detalhe?: string | null;
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
          className="text-sm"
          style={{ color: "var(--text-4)" }}
        >
          {vazioLabel}
        </div>
      ) : null}

      <div className="space-y-3">
        {itens.map((item) => (
          <article key={item.id} className="flex items-start gap-3">
            <div
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--accent-2)" }}
            />

            <div className="min-w-0 flex-1 space-y-1">
              {item.titulo ? (
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-1)" }}
                >
                  {item.titulo}
                </p>
              ) : null}

              <p
                className="text-sm leading-6"
                style={{ color: "var(--text-2)" }}
              >
                {item.autorNome ? `${item.autorNome} · ` : ""}
                {item.descricao}
              </p>

              {item.detalhe ? (
                <p
                  className="text-xs leading-5"
                  style={{ color: "var(--text-4)" }}
                >
                  {item.detalhe}
                </p>
              ) : null}

              <p
                className="text-xs"
                style={{ color: "var(--text-4)" }}
              >
                {formatarDataHora(item.criadoEm)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}