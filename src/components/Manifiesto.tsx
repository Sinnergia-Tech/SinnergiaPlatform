import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";

const lines = [
  "La atención se captura.",
  "El significado se construye.",
  "Creemos en la fricción.",
  "En las preguntas.",
  "En cuestionar lo que todos dan por sentado.",
  "En definir el QUÉ antes de discutir el CÓMO.",
];

export function Manifiesto() {
  return (
    <section className="bg-paper py-28 md:py-36">
      <Container>
        <Reveal>
          <p className="kicker text-center text-ink/40">Manifiesto</p>
        </Reveal>

        <div className="mx-auto mt-14 max-w-4xl text-center">
          {lines.map((l, i) => (
            <Reveal key={l} delay={i * 80}>
              <p className="text-2xl font-light leading-[1.5] tracking-[-0.01em] text-ink sm:text-4xl sm:leading-[1.45]">
                {l}
              </p>
            </Reveal>
          ))}
          <Reveal delay={lines.length * 80}>
            <p className="mt-10 text-xl font-medium leading-relaxed text-ink/60 sm:text-2xl">
              Porque cuando entendemos el problema correcto,
              <br className="hidden sm:block" /> las soluciones aparecen solas.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
