export default function TarefasLoading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="h-8 w-56 rounded bg-zinc-800" />
        <div className="mt-3 h-4 w-80 rounded bg-zinc-800" />
      </div>

      <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="h-10 w-full rounded bg-zinc-800" />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
          >
            <div className="h-6 w-24 rounded bg-zinc-800" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <div
                  key={cardIndex}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
                >
                  <div className="h-4 w-3/4 rounded bg-zinc-800" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-zinc-800" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}