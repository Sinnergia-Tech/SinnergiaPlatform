import { Container } from "./ui/Container";
import { Button } from "./ui/Button";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-ink text-paper"
    >
      {/* Isotipo gigante de fondo, muy sutil */}
      <img
        src="/brand/logo-blanco.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 hidden w-[46rem] max-w-none -translate-y-1/2 opacity-[0.04] md:block"
      />

      <Container className="relative z-10 pt-28 pb-16">
        <p
          className="kicker fade-up text-paper/50"
          style={{ animationDelay: "0.05s" }}
        >
          Estudio · Laboratorio de ideas
        </p>

        <h1
          className="fade-up mt-6 max-w-5xl text-[2.7rem] font-light leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-[5.2rem]"
          style={{ animationDelay: "0.12s" }}
        >
          Definamos el <span className="font-semibold">QUÉ.</span>
          <br />
          Nosotros te explicamos
          <br className="hidden sm:block" /> el <span className="font-semibold">CÓMO.</span>
        </h1>

        <div
          className="fade-up mt-10 space-y-1.5 text-lg text-paper/60 sm:text-xl"
          style={{ animationDelay: "0.24s" }}
        >
          <p>No somos una agencia.</p>
          <p>No somos una bolsa de trabajo.</p>
          <p>No somos una consultora tradicional.</p>
        </div>

        <p
          className="fade-up mt-8 max-w-2xl text-base text-paper/75 sm:text-lg"
          style={{ animationDelay: "0.34s" }}
        >
          Ayudamos a las empresas a identificar qué necesitan y con quién resolverlo.
        </p>

        <div
          className="fade-up mt-12 flex flex-col gap-4 sm:flex-row"
          style={{ animationDelay: "0.44s" }}
        >
          <Button href="/diagnostico" tone="onDark" variant="solid">
            Solicitar diagnóstico
          </Button>
          <Button href="/sumate" tone="onDark" variant="outline">
            Sumarme a la red
          </Button>
        </div>
      </Container>

      {/* Indicador de scroll */}
      <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center">
        <div className="flex flex-col items-center gap-2 text-paper/40">
          <span className="text-[0.65rem] uppercase tracking-[0.25em]">Scroll</span>
          <span className="h-10 w-px animate-pulse bg-paper/30" />
        </div>
      </div>
    </section>
  );
}
