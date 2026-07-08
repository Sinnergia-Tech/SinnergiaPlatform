import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAccount } from "@/lib/account-guard";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Container } from "@/components/ui/Container";
import { Markdown } from "@/components/ui/Markdown";
import { getFeedback, markFeedbackRead } from "@/lib/data";
import { formatFileSize } from "@/lib/feedback-files";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function DevolucionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session } = await requireAccount();
  const { role, companyId } = session.user;

  if (role === "admin") redirect(`/admin`);

  const fb = await getFeedback(id);
  // Sólo la empresa dueña puede verla, y sólo si está publicada.
  if (!fb || fb.status !== "published" || role !== "empresa" || fb.companyId !== companyId) {
    notFound();
  }

  await markFeedbackRead(id);

  return (
    <main className="min-h-screen bg-smoke">
      <AccountTopbar user={{ nombre: session.user.name ?? "", rol: role }} />
      <Container className="max-w-3xl py-10">
        <Link href="/cuenta" className="mb-6 inline-block text-sm text-ink/50 hover:text-ink">
          ← Volver a mi cuenta
        </Link>

        <article className="border border-ink/12 bg-paper p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-ink/40">
                Devolución{fb.categoria ? ` · ${fb.categoria}` : ""}
              </div>
              <h1 className="mt-1.5 text-2xl font-semibold">{fb.title}</h1>
              <p className="mt-1 text-sm text-ink/50">
                {fb.publishedAt ? fmt(fb.publishedAt) : fmt(fb.createdAt)}
              </p>
            </div>
            {fb.score !== null && (
              <div className="text-right">
                <div className="text-lg text-ink">
                  {"★".repeat(fb.score)}
                  <span className="text-ink/20">{"★".repeat(5 - fb.score)}</span>
                </div>
                <div className="text-xs text-ink/45">{fb.score}/5</div>
              </div>
            )}
          </div>

          <div className="mt-7 border-t border-ink/10 pt-6">
            <Markdown>{fb.descriptionMd}</Markdown>
          </div>

          {fb.fortalezasMd?.trim() && (
            <div className="mt-7 border-t border-ink/10 pt-6">
              <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.1em] text-ink/50">
                Fortalezas
              </h2>
              <Markdown>{fb.fortalezasMd}</Markdown>
            </div>
          )}

          {fb.mejorasMd?.trim() && (
            <div className="mt-7 border-t border-ink/10 pt-6">
              <h2 className="mb-2 text-sm font-medium uppercase tracking-[0.1em] text-ink/50">
                Oportunidades de mejora
              </h2>
              <Markdown>{fb.mejorasMd}</Markdown>
            </div>
          )}

          {fb.attachments.length > 0 && (
            <div className="mt-7 border-t border-ink/10 pt-6">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.1em] text-ink/50">
                Archivos adjuntos
              </h2>
              <ul className="space-y-2">
                {fb.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={`/api/feedback/attachment/${a.id}`}
                      className="flex items-center justify-between gap-3 border border-ink/12 px-4 py-3 text-sm transition-colors hover:bg-smoke/60"
                    >
                      <span className="min-w-0 flex-1 truncate">{a.fileName}</span>
                      <span className="shrink-0 text-xs text-ink/45">
                        {formatFileSize(a.size)} · Descargar ↓
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </Container>
    </main>
  );
}
