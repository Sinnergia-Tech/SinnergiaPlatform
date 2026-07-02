import { Container } from "./ui/Container";

const social = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "WhatsApp", href: "#" },
];

const nav = [
  { label: "Problema", href: "#problema" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Servicios", href: "#servicios" },
  { label: "Red Sinnergia", href: "#red" },
  { label: "Portfolio", href: "#portfolio" },
];

export function Footer() {
  return (
    <footer className="bg-paper pb-10 pt-20">
      <Container>
        {/* Newsletter */}
        <div className="grid gap-12 border-b border-ink/10 pb-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/isotipo-negro.png"
                alt="Sinnergia Studio"
                className="h-9 w-9 object-contain"
              />
              <span className="text-base font-semibold uppercase tracking-[0.18em] text-ink">
                Sinnergia<span className="font-light">Studio</span>
              </span>
            </div>
            <p className="mt-6 max-w-sm text-lg font-light leading-snug text-ink/60">
              La comunidad donde empresarios y profesionales se encuentran para resolver
              problemas de marketing, comunicación y crecimiento.
            </p>
          </div>

          <div className="lg:pl-10">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-ink">
              Newsletter Sinnérgico
            </p>
            <p className="mt-3 text-sm text-ink/50">
              Ideas, preguntas y criterio. Sin ruido.
            </p>
            <form className="mt-6 flex border border-ink/20">
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full bg-transparent px-4 py-3.5 text-sm text-ink outline-none placeholder:text-ink/35"
                aria-label="Email"
              />
              <button
                type="button"
                className="shrink-0 bg-ink px-6 text-xs font-medium uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink/85"
              >
                Suscribirme
              </button>
            </form>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-10 py-14 md:flex-row md:justify-between">
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="link-underline text-sm text-ink/70 hover:text-ink"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {social.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="link-underline text-sm font-medium text-ink hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-2 border-t border-ink/10 pt-8 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Sinnergia Studio. Todos los derechos reservados.</span>
          <span>Definamos el QUÉ · Te explicamos el CÓMO</span>
        </div>
      </Container>
    </footer>
  );
}
