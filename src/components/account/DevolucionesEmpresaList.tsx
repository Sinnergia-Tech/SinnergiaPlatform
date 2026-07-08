import Link from "next/link";

type Row = {
  id: string;
  title: string;
  score: number | null;
  categoria: string | null;
  publishedAt: string;
  readAt: string | null;
  attachmentsCount: number;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

/** Lista de devoluciones (publicadas) que ve la empresa en /cuenta. */
export function DevolucionesEmpresaList({ feedbacks }: { feedbacks: Row[] }) {
  if (feedbacks.length === 0) return null;

  return (
    <section className="border border-ink/10 bg-paper p-6">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Devoluciones</h2>
      <p className="mt-1 text-xs text-ink/45">
        Las devoluciones del equipo de Sinnergia sobre tu empresa.
      </p>
      <ul className="mt-5 space-y-2">
        {feedbacks.map((f) => (
          <li key={f.id}>
            <Link
              href={`/cuenta/devoluciones/${f.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border border-ink/12 px-4 py-3 transition-colors hover:bg-smoke/60"
            >
              <div className="flex items-center gap-3">
                {!f.readAt && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-ink" aria-label="Sin leer" />
                )}
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="mt-0.5 text-xs text-ink/50">
                    {fmt(f.publishedAt)}
                    {f.categoria && ` · ${f.categoria}`}
                    {f.attachmentsCount > 0 && ` · ${f.attachmentsCount} archivo(s)`}
                  </div>
                </div>
              </div>
              {f.score !== null && (
                <span className="text-sm text-ink/60">
                  {"★".repeat(f.score)}
                  <span className="text-ink/20">{"★".repeat(5 - f.score)}</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
