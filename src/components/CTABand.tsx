import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { Button } from "./ui/Button";

export function CTABand({ showDiagnostico = true }: { showDiagnostico?: boolean }) {
  return (
    <section id="diagnostico" className="bg-ink py-24 text-paper md:py-32">
      <Container>
        <Reveal className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="kicker text-paper/40">Empecemos</p>
            <h2 className="mt-5 text-4xl font-light leading-[1.05] tracking-[-0.02em] sm:text-6xl">
              Definamos el <span className="font-semibold">QUÉ.</span>
            </h2>
            <p className="mt-6 text-lg text-paper/60">
              Reservá tu Diagnóstico Estratégico. En dos reuniones entendemos tu
              problema y armamos una propuesta concreta.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-4 sm:flex-row lg:flex-col">
            {showDiagnostico && (
              <Button href="/diagnostico" tone="onDark" variant="solid">
                Solicitar diagnóstico
              </Button>
            )}
            <Button href="/sumate" tone="onDark" variant="outline">
              Sumarme a la red
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
