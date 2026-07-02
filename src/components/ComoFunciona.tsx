import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";

const steps = [
  {
    n: "01",
    title: "Diagnóstico",
    desc: "Entendemos tu negocio, tus objetivos y tu contexto real.",
  },
  {
    n: "02",
    title: "Interpretación",
    desc: "Traducimos el problema en necesidades concretas y accionables.",
  },
  {
    n: "03",
    title: "Propuesta",
    desc: "Definimos qué se necesita resolver y con qué perfiles.",
  },
  {
    n: "04",
    title: "Match",
    desc: "Te conectamos con los profesionales o equipos adecuados.",
  },
  {
    n: "05",
    title: "Supervisión",
    desc: "Acompañamos, auditamos y coordinamos la ejecución.",
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-ink py-24 text-paper md:py-32">
      <Container>
        <Reveal>
          <p className="kicker text-paper/40">Cómo funciona Sinnergia</p>
          <h2 className="mt-5 max-w-2xl text-3xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            Un método, cinco pasos.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden border border-paper/15 bg-paper/15 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 90}
              className="group relative flex min-h-[240px] flex-col bg-ink p-7 transition-colors duration-500 hover:bg-paper hover:text-ink"
            >
              <span className="text-5xl font-extralight text-paper/30 transition-colors duration-500 group-hover:text-ink/25">
                {s.n}
              </span>
              <h3 className="mt-8 text-xl font-semibold uppercase tracking-[0.04em]">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-paper/55 transition-colors duration-500 group-hover:text-ink/60">
                {s.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
