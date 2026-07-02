import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { Placeholder } from "./ui/Placeholder";

const necesidades = [
  "Diseño",
  "Community",
  "Paid Media",
  "Ecommerce",
  "Web",
  "Branding",
  "Producción",
  "Automatización",
];

const modalidades = ["Remoto", "Presencial", "Híbrido"];

export function RedSinnergia() {
  return (
    <section id="red" className="bg-smoke py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="kicker text-ink/40">Red Sinnergia</p>
          <h2 className="mt-5 text-3xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            Encontrá quién lo resuelva.
          </h2>
          <p className="mt-6 text-lg text-ink/55">
            Una red curada de profesionales, agencias y equipos. No te mostramos gente:
            te conectamos con el perfil correcto para tu problema.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* Buscador mock (preparado para conectar a la BD) */}
          <Reveal className="border border-ink/15 bg-paper p-7 sm:p-9">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-ink">
                ¿Qué necesitás?
              </p>
              <span className="kicker text-ink/30">Vista previa</span>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2.5">
              {necesidades.map((n) => (
                <li
                  key={n}
                  className="cursor-default border border-ink/20 px-4 py-2 text-sm text-ink/80 transition-colors duration-300 hover:border-ink hover:text-ink"
                >
                  {n}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm font-medium uppercase tracking-[0.12em] text-ink">
              Modalidad
            </p>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {modalidades.map((m) => (
                <li
                  key={m}
                  className="cursor-default border border-ink/20 px-4 py-2 text-sm text-ink/80 transition-colors duration-300 hover:border-ink hover:text-ink"
                >
                  {m}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled
              className="mt-9 w-full cursor-not-allowed bg-ink px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-paper opacity-90"
            >
              Buscar perfiles
            </button>
            <p className="mt-3 text-center text-xs text-ink/40">
              El directorio completo llega en la próxima fase.
            </p>
          </Reveal>

          {/* Perfil de ejemplo */}
          <Reveal delay={120} className="border border-ink/15 bg-paper p-7 sm:p-9">
            <div className="flex items-start gap-5">
              <div className="w-24 shrink-0">
                <Placeholder label="Foto" ratio="1 / 1" />
              </div>
              <div className="pt-1">
                <h3 className="text-2xl font-semibold">Nicolás</h3>
                <p className="text-sm uppercase tracking-[0.12em] text-ink/50">
                  Filmmaker
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4 border-t border-ink/10 pt-7 text-sm">
              <Row label="Experiencia" value="Eventos · Automotriz · Podcast" />
              <Row label="Modalidad" value="Híbrido" />
              <Row label="Honorarios" value="$$ orientativo" />
              <Row label="Disponibilidad" value="Inmediata" />
            </div>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="/diagnostico"
                className="group inline-flex items-center gap-2 bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85"
              >
                Solicitar Match
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
              <span className="kicker text-ink/30">Perfil de ejemplo</span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-ink/45">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
