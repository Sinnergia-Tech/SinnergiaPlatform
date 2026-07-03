import { ReactNode } from "react";
import { SiteTopbar } from "@/components/SiteTopbar";
import { Container } from "@/components/ui/Container";

export function LegalPageLayout({
  kicker,
  title,
  updatedAt,
  children,
}: {
  kicker: string;
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-paper">
      <SiteTopbar />

      <section className="border-b border-ink/10 bg-ink py-16 text-paper">
        <Container>
          <p className="kicker text-paper/40">{kicker}</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-sm text-paper/40">Última actualización: {updatedAt}</p>
        </Container>
      </section>

      <Container className="max-w-2xl py-16">
        <p className="mb-12 border border-ink/15 bg-smoke px-5 py-4 text-sm text-ink/55">
          Este texto es un contenido provisorio (lorem ipsum) a modo de placeholder.
          Todavía no es la versión definitiva.
        </p>
        <div className="space-y-10">{children}</div>
      </Container>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <div className="mt-3 space-y-4 text-sm leading-relaxed text-ink/65">{children}</div>
    </section>
  );
}
