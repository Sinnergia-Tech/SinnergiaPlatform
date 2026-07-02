"use client";

import { useState } from "react";
import { SiteTopbar } from "@/components/SiteTopbar";
import { Container } from "@/components/ui/Container";
import {
  Field,
  TextInput,
  TextArea,
  Select,
  ChoiceChips,
} from "@/components/ui/Form";
import { RUBROS, TAMANOS_EMPRESA, PRESUPUESTOS } from "@/lib/catalogs";
import { submitDiagnosisAction } from "@/lib/actions";

export default function DiagnosticoPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    contacto: "",
    email: "",
    telefono: "",
    rubro: "",
    tamano: "",
    sitioWeb: "",
    facturacion: "",
    objetivos: "",
    presupuesto: "",
    equipoActual: "",
    problemaPrincipal: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await submitDiagnosisAction({
      nombre: form.nombre,
      contacto: form.contacto,
      email: form.email,
      telefono: form.telefono || undefined,
      rubro: form.rubro,
      tamano: form.tamano || undefined,
      sitioWeb: form.sitioWeb || undefined,
      facturacion: form.facturacion || undefined,
      objetivos: form.objetivos,
      presupuesto: form.presupuesto,
      equipoActual: form.equipoActual || undefined,
      problemaPrincipal: form.problemaPrincipal,
    });
    setPending(false);
    if (res.ok) {
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.error ?? "No se pudo enviar. Probá de nuevo.");
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-paper">
        <SiteTopbar />
        <Container className="flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-ink text-2xl">
            ✓
          </div>
          <h1 className="mt-8 text-3xl font-light sm:text-4xl">
            Recibimos tu diagnóstico.
          </h1>
          <p className="mt-4 max-w-md text-ink/60">
            Vamos a leerlo con atención y coordinar la primera entrevista. Definamos el
            QUÉ juntos.
          </p>
          <a
            href="/"
            className="mt-10 bg-ink px-7 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85"
          >
            Volver al inicio
          </a>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <SiteTopbar />

      <section className="border-b border-ink/10 bg-ink py-16 text-paper">
        <Container>
          <p className="kicker text-paper/40">Diagnóstico estratégico · USD 150</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            Definamos el <span className="font-semibold">QUÉ.</span>
          </h1>
          <p className="mt-5 max-w-xl text-paper/60">
            Contanos sobre tu negocio. No hace falta que sepas qué necesitás — para eso
            estamos. Cuanto más claro seas, mejor el diagnóstico.
          </p>
        </Container>
      </section>

      <Container className="max-w-3xl py-16">
        <form onSubmit={submit} className="space-y-12">
          {/* Empresa */}
          <fieldset className="space-y-6">
            <legend className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              01 · Tu empresa
            </legend>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nombre de la empresa" required>
                <TextInput
                  required
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej. Jano's"
                />
              </Field>
              <Field label="Persona de contacto" required>
                <TextInput
                  required
                  value={form.contacto}
                  onChange={(e) => set("contacto", e.target.value)}
                  placeholder="Nombre y apellido"
                />
              </Field>
              <Field label="Email" required>
                <TextInput
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="tu@empresa.com"
                />
              </Field>
              <Field label="Teléfono / WhatsApp">
                <TextInput
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="+54 9 11 …"
                />
              </Field>
              <Field label="Rubro" required>
                <Select
                  value={form.rubro}
                  onChange={(v) => set("rubro", v)}
                  options={RUBROS}
                  placeholder="Elegí tu rubro"
                />
              </Field>
              <Field label="Tamaño del equipo">
                <Select
                  value={form.tamano}
                  onChange={(v) => set("tamano", v)}
                  options={TAMANOS_EMPRESA}
                  placeholder="Cantidad de personas"
                />
              </Field>
            </div>
            <Field label="Sitio web">
              <TextInput
                value={form.sitioWeb}
                onChange={(e) => set("sitioWeb", e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </fieldset>

          {/* Contexto */}
          <fieldset className="space-y-6">
            <legend className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              02 · Tu contexto
            </legend>
            <Field label="Facturación aproximada" hint="Nos ayuda a dimensionar la propuesta. Opcional.">
              <TextInput
                value={form.facturacion}
                onChange={(e) => set("facturacion", e.target.value)}
                placeholder="Ej. USD 20k-50k / mes"
              />
            </Field>
            <Field label="¿Cuáles son tus objetivos?" required>
              <TextArea
                required
                value={form.objetivos}
                onChange={(e) => set("objetivos", e.target.value)}
                placeholder="¿Qué querés lograr en los próximos meses?"
              />
            </Field>
            <Field label="Presupuesto orientativo" required>
              <ChoiceChips
                value={form.presupuesto}
                onChange={(v) => set("presupuesto", v)}
                options={PRESUPUESTOS}
              />
            </Field>
            <Field label="¿Cómo es tu equipo actual?">
              <TextArea
                value={form.equipoActual}
                onChange={(e) => set("equipoActual", e.target.value)}
                placeholder="¿Tenés equipo interno, agencia, freelancers? ¿Nadie?"
              />
            </Field>
            <Field
              label="¿Cuál es el problema principal?"
              hint="Contanos lo que creés que necesitás — nosotros lo interpretamos."
              required
            >
              <TextArea
                required
                value={form.problemaPrincipal}
                onChange={(e) => set("problemaPrincipal", e.target.value)}
                placeholder="Ej. 'Creo que necesito un Community Manager'…"
              />
            </Field>
          </fieldset>

          <div className="flex flex-col items-start gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink/45">
              {error ? (
                <span className="text-ink">⚠ {error}</span>
              ) : (
                "Te contactamos para coordinar la primera entrevista."
              )}
            </p>
            <button
              type="submit"
              disabled={pending}
              className="group inline-flex items-center gap-2 bg-ink px-8 py-4 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Solicitar diagnóstico"}
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </form>
      </Container>
    </main>
  );
}
