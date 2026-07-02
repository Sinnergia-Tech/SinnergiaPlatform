import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";

const servicios = [
  {
    tag: "01",
    title: "Diagnóstico Estratégico",
    price: "USD 150",
    desc: "El punto de partida. Entendemos el problema real antes de proponer soluciones.",
    incluye: [
      "Primera entrevista",
      "Análisis y diagnóstico",
      "Segunda reunión",
      "Propuesta",
    ],
    cta: "Reservar asesoría",
    href: "/diagnostico",
    featured: true,
  },
  {
    tag: "02",
    title: "Supervisión Mensual",
    price: "Abono mensual",
    desc: "Nos convertimos en tu representante de marketing. Auditamos, coordinamos y acompañamos.",
    incluye: ["Agencias", "Freelancers", "Equipo interno"],
    cta: "Conocer más",
    href: "/diagnostico",
    featured: false,
  },
  {
    tag: "03",
    title: "Armado de Equipos In House",
    price: "A medida",
    desc: "¿Querés crear un área de marketing? Te ayudamos a construirla desde cero.",
    incluye: [
      "Definición de roles",
      "Reclutamiento",
      "Selección",
      "Implementación",
    ],
    cta: "Conocer más",
    href: "/diagnostico",
    featured: false,
  },
];

export function Servicios() {
  return (
    <section id="servicios" className="border-b border-ink/10 bg-paper py-24 md:py-32">
      <Container>
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="kicker text-ink/40">Servicios</p>
            <h2 className="mt-5 max-w-xl text-3xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
              Tres formas de trabajar juntos.
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {servicios.map((s, i) => (
            <Reveal
              key={s.tag}
              delay={i * 100}
              className={`flex flex-col border p-8 transition-colors duration-500 ${
                s.featured
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 bg-paper text-ink hover:border-ink"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${s.featured ? "text-paper/40" : "text-ink/30"}`}
                >
                  {s.tag}
                </span>
                <span
                  className={`text-sm font-medium uppercase tracking-[0.1em] ${
                    s.featured ? "text-paper" : "text-ink"
                  }`}
                >
                  {s.price}
                </span>
              </div>

              <h3 className="mt-8 text-2xl font-semibold leading-tight">
                {s.title}
              </h3>
              <p
                className={`mt-4 text-sm leading-relaxed ${
                  s.featured ? "text-paper/65" : "text-ink/55"
                }`}
              >
                {s.desc}
              </p>

              <ul
                className={`mt-7 space-y-2.5 border-t pt-7 text-sm ${
                  s.featured ? "border-paper/20" : "border-ink/10"
                }`}
              >
                {s.incluye.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span
                      className={`h-px w-4 ${
                        s.featured ? "bg-paper/50" : "bg-ink/40"
                      }`}
                    />
                    <span className={s.featured ? "text-paper/80" : "text-ink/70"}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={s.href}
                className={`group mt-8 inline-flex items-center gap-2 self-start text-sm font-medium uppercase tracking-[0.12em] ${
                  s.featured ? "text-paper" : "text-ink"
                }`}
              >
                <span className="link-underline">{s.cta}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
