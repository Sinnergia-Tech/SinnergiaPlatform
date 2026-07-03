import { Container } from "./ui/Container";

// Redes oficiales de Sinnergia.
const socials = [
  { label: "Instagram", href: "https://www.instagram.com/sinnergiastudio/", icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/sinnergiastudio/", icon: FacebookIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/sinnergia-studio/", icon: LinkedInIcon },
];

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-8h2.2l.33-2.7h-2.53V8.57c0-.78.22-1.3 1.33-1.3H16.2V4.86c-.25-.03-1.1-.11-2.1-.11-2.08 0-3.5 1.27-3.5 3.6v2.01H8.3v2.7h2.3V21h2.9z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.94 8.6H4.2V20h2.74V8.6zM5.57 4.2a1.6 1.6 0 100 3.2 1.6 1.6 0 000-3.2zM20 20v-6.3c0-3.02-1.61-4.42-3.76-4.42-1.73 0-2.5.95-2.94 1.62V8.6h-2.74c.04.77 0 11.4 0 11.4h2.74v-6.37c0-.25.02-.5.09-.67.2-.5.66-1.02 1.42-1.02 1 0 1.4.76 1.4 1.88V20H20z" />
    </svg>
  );
}

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
          <nav className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center border border-ink/20 text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <s.icon />
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-4 border-t border-ink/10 pt-8 text-xs text-ink/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Sinnergia Studio. Todos los derechos reservados.</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="/terminos-y-condiciones" className="link-underline text-ink/40 hover:text-ink">
              Términos y condiciones
            </a>
            <a href="/privacidad" className="link-underline text-ink/40 hover:text-ink">
              Política de privacidad
            </a>
            <span>Definamos el QUÉ · Te explicamos el CÓMO</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
