import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { Placeholder } from "./ui/Placeholder";

const flujo = ["Problema", "Diagnóstico", "Solución", "Resultado"];

const casos = [
  { label: "Caso 01", ratio: "4 / 3" },
  { label: "Caso 02", ratio: "4 / 3" },
  { label: "Caso 03", ratio: "4 / 3" },
];

export function Portfolio() {
  return (
    <section id="portfolio" className="border-b border-ink/10 bg-paper py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="kicker text-ink/40">Casos & Portfolio</p>
          <h2 className="mt-5 text-3xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            No mostramos clientes. Mostramos criterio.
          </h2>
        </Reveal>

        {/* El flujo diferencial */}
        <Reveal className="mt-12 flex flex-wrap items-center gap-3">
          {flujo.map((f, i) => (
            <div key={f} className="flex items-center gap-3">
              <span className="border border-ink px-5 py-2.5 text-sm font-medium uppercase tracking-[0.08em]">
                {f}
              </span>
              {i < flujo.length - 1 && (
                <span className="text-ink/30">→</span>
              )}
            </div>
          ))}
        </Reveal>

        {/* Grilla de casos con placeholders */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {casos.map((c, i) => (
            <Reveal key={c.label} delay={i * 100} as="article" className="group">
              <div className="overflow-hidden">
                <Placeholder label="Imagen del caso" ratio={c.ratio} />
              </div>
              <div className="mt-5">
                <p className="kicker text-ink/40">{c.label}</p>
                <h3 className="mt-2 text-lg font-medium">Título del proyecto</h3>
                <p className="mt-1 text-sm text-ink/50">
                  Problema → Diagnóstico → Solución
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
