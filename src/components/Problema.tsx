import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";

const needs = [
  "Ads",
  "Ecommerce",
  "Branding",
  "Automatización",
  "Contenido",
  "Equipo interno",
];

export function Problema() {
  return (
    <section id="problema" className="border-b border-ink/10 bg-paper py-24 md:py-32">
      <Container>
        <Reveal>
          <p className="kicker text-ink/40">¿Qué problema resolvemos?</p>
        </Reveal>

        <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Columna izquierda: el recorrido mental (riel vertical) */}
          <Reveal>
            <div className="space-y-9 border-l-2 border-ink/15 pl-8">
              <div>
                <span className="mb-3 block text-xs uppercase tracking-[0.16em] text-ink/40">
                  La empresa dice
                </span>
                <p className="text-2xl font-light leading-snug text-ink sm:text-3xl">
                  “Necesito un{" "}
                  <span className="font-semibold">Community Manager</span>.”
                </p>
              </div>

              <div>
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-ink/40">
                  Nosotros preguntamos
                </span>
                <p className="text-xl font-medium text-ink/60">¿Seguro?</p>
              </div>

              <div>
                <span className="mb-4 block text-xs uppercase tracking-[0.16em] text-ink/40">
                  Capaz necesitás
                </span>
                <ul className="flex flex-wrap gap-2.5">
                  {needs.map((n) => (
                    <li
                      key={n}
                      className="border border-ink/20 px-4 py-2 text-sm text-ink transition-colors duration-300 hover:bg-ink hover:text-paper"
                    >
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Columna derecha: el mensaje */}
          <Reveal delay={120} className="flex flex-col justify-center">
            <p className="text-3xl font-light leading-tight tracking-[-0.01em] text-ink sm:text-[2.6rem]">
              La mayoría de las empresas no saben qué contratar.
            </p>
            <p className="mt-6 text-2xl font-semibold text-ink sm:text-3xl">
              Y eso está bien.
            </p>
            <p className="mt-6 max-w-md text-lg text-ink/55">
              Nosotros te ayudamos a entenderlo. Definimos el problema correcto antes de
              discutir la solución.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
