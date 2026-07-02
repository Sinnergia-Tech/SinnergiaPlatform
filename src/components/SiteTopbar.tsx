import { Container } from "./ui/Container";

/** Barra superior mínima para páginas standalone (formularios). */
export function SiteTopbar() {
  return (
    <header className="border-b border-ink/10 bg-paper">
      <Container className="flex h-[72px] items-center justify-between">
        <a href="/" className="flex items-center gap-3" aria-label="Sinnergia Studio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/isotipo-negro.png"
            alt="Sinnergia Studio"
            className="h-8 w-8 object-contain"
          />
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">
            Sinnergia<span className="font-light">Studio</span>
          </span>
        </a>
        <a
          href="/"
          className="link-underline text-sm text-ink/70 hover:text-ink"
        >
          ← Volver al inicio
        </a>
      </Container>
    </header>
  );
}
