import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { Button } from "./ui/Button";

const perfiles = [
  "Diseñadores",
  "Editores",
  "Paid Media",
  "Programadores",
  "Agencias",
  "Freelancers",
  "Equipos",
];

export function Sumate() {
  return (
    <section id="sumate" className="bg-ink py-24 text-paper md:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="kicker text-paper/40">Sumate a la red</p>
            <h2 className="mt-5 text-3xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
              ¿Sos parte de la solución?
            </h2>
            <p className="mt-6 max-w-md text-lg text-paper/60">
              Si trabajás en marketing, comunicación o tecnología, aplicá a la Red
              Sinnergia. Curamos cada perfil para conectar a las empresas con quien
              realmente puede resolver su problema.
            </p>
            <div className="mt-10">
              <Button href="/sumate" tone="onDark" variant="solid">
                Aplicar a la red
              </Button>
            </div>
          </Reveal>

          <Reveal delay={120} className="flex flex-col justify-center">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-paper/50">
              ¿Quiénes pueden aplicar?
            </p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {perfiles.map((p) => (
                <li
                  key={p}
                  className="border border-paper/25 px-4 py-2 text-sm text-paper/85 transition-colors duration-300 hover:bg-paper hover:text-ink"
                >
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden border border-paper/15 bg-paper/15 text-center">
              {[
                ["+50", "Perfiles objetivo"],
                ["6", "Especialidades"],
                ["100%", "Curados a mano"],
              ].map(([big, small]) => (
                <div key={small} className="bg-ink px-3 py-6">
                  <div className="text-3xl font-semibold">{big}</div>
                  <div className="mt-1 text-xs text-paper/45">{small}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
