export default function LoadingProjetosPage() {
  return (
    <div className="space-y-6">
      <section
        className="rounded-[var(--radius-2xl)] p-6"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="h-8 w-40 animate-pulse rounded-xl bg-[var(--surface-3)]" />
        <div className="mt-3 h-5 w-full max-w-3xl animate-pulse rounded-xl bg-[var(--surface-3)]" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius-2xl)] p-5"
            style={{
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="h-4 w-24 animate-pulse rounded-xl bg-[var(--surface-3)]" />
            <div className="mt-4 h-8 w-28 animate-pulse rounded-xl bg-[var(--surface-3)]" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-xl bg-[var(--surface-3)]" />
          </div>
        ))}
      </section>

      <section
        className="rounded-[var(--radius-2xl)] p-5"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="h-11 w-full animate-pulse rounded-2xl bg-[var(--surface-3)]" />
      </section>

      <section
        className="rounded-[var(--radius-2xl)] p-6"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="h-56 w-full animate-pulse rounded-2xl bg-[var(--surface-3)]" />
      </section>
    </div>
  );
}