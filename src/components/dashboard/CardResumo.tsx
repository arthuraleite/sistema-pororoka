type PropriedadesCardResumo = {
  titulo: string;
  valor: string;
  descricao: string;
};

export function CardResumo({
  titulo,
  valor,
  descricao,
}: PropriedadesCardResumo) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <p className="text-sm text-zinc-400">{titulo}</p>
      <p className="mt-3 text-2xl font-semibold text-zinc-100">{valor}</p>
      <p className="mt-2 text-sm text-zinc-500">{descricao}</p>
    </div>
  );
}