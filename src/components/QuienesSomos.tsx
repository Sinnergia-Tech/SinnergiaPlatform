import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { Avatar } from "./directory/Avatar";

// Datos mockeados — a completar con la info real de cada creador.
const team = [
  {
    nombre: "Cami",
    rol: "Co-fundadora",
    bio: "Bio a completar.",
    instagram: "camisinnergia",
    url: "https://www.instagram.com/camisinnergia/",
  },
  {
    nombre: "Nico Fabiani",
    rol: "Co-fundador · Audiovisual",
    bio: "Bio a completar.",
    instagram: "nicofabiani.av",
    url: "https://www.instagram.com/nicofabiani.av/",
  },
];

export function QuienesSomos() {
  return (
    <section
      id="quienes-somos"
      className="border-b border-ink/10 bg-paper py-24 md:py-32"
    >
      <Container>
        <Reveal className="max-w-2xl">
          <p className="kicker text-ink/40">Quiénes somos</p>
          <h2 className="mt-5 text-3xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            Las personas detrás del estudio.
          </h2>
          <p className="mt-6 text-lg text-ink/55">
            Un equipo chico que cree en definir el problema correcto antes de buscar la
            solución. <span className="text-ink/40">(Texto a completar.)</span>
          </p>
        </Reveal>

        <div className="mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          {team.map((m, i) => (
            <Reveal
              key={m.instagram}
              delay={i * 100}
              className="flex flex-col border border-ink/12 bg-paper p-7 transition-colors hover:border-ink"
            >
              <div className="flex items-center gap-4">
                <Avatar name={m.nombre} size={56} />
                <div>
                  <h3 className="text-lg font-semibold leading-tight">{m.nombre}</h3>
                  <p className="text-sm uppercase tracking-[0.08em] text-ink/50">
                    {m.rol}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm text-ink/60">{m.bio}</p>

              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="link-underline mt-6 inline-flex self-start text-sm font-medium text-ink"
              >
                @{m.instagram} ↗
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
