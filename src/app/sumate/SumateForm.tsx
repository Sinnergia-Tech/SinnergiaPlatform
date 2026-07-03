"use client";

import { useState } from "react";
import { SiteTopbar } from "@/components/SiteTopbar";
import { AccountTopbar } from "@/components/account/AccountTopbar";
import { Container } from "@/components/ui/Container";
import {
  Field,
  TextInput,
  TextArea,
  ChoiceChips,
  MultiChips,
} from "@/components/ui/Form";
import {
  ROLES,
  RUBROS,
  EXPERIENCIAS,
  MODALIDADES,
  PRESUPUESTOS,
  DISPONIBILIDADES,
} from "@/lib/catalogs";
import { submitApplicationAction } from "@/lib/actions";
import { isPasswordValid, PASSWORD_HINT } from "@/lib/password-policy";

export function SumateForm({
  account,
}: {
  account: { nombre: string; rol: string } | null;
}) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    whatsapp: "",
    linkedin: "",
    instagram: "",
    portfolioUrl: "",
    titular: "",
    descripcion: "",
    roles: [] as string[],
    rubros: [] as string[],
    experiencia: "",
    honorarios: "",
    modalidad: "",
    disponibilidad: "",
    password: "",
    confirmPassword: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const passwordOk = isPasswordValid(form.password);
  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await submitApplicationAction({
      nombre: form.nombre,
      email: form.email,
      whatsapp: form.whatsapp || undefined,
      linkedin: form.linkedin || undefined,
      instagram: form.instagram || undefined,
      portfolioUrl: form.portfolioUrl || undefined,
      titular: form.titular,
      descripcion: form.descripcion,
      roles: form.roles,
      rubros: form.rubros,
      experiencia: form.experiencia,
      honorarios: form.honorarios,
      modalidad: form.modalidad,
      disponibilidad: form.disponibilidad,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    setPending(false);
    if (res.ok) {
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(res.error ?? "No se pudo enviar. Probá de nuevo.");
    }
  };

  const Topbar = () =>
    account ? <AccountTopbar user={account} /> : <SiteTopbar />;

  if (sent) {
    return (
      <main className="min-h-screen bg-paper">
        <Topbar />
        <Container className="flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-ink text-2xl">
            ✓
          </div>
          <h1 className="mt-8 text-3xl font-light sm:text-4xl">
            ¡Aplicación recibida!
          </h1>
          <p className="mt-4 max-w-md text-ink/60">
            Te mandamos un email para confirmar tu cuenta — hacé click en el enlace
            para poder ingresar. Mientras tanto, vamos a revisar tu perfil; la
            curaduría es manual, así que puede tomar unos días.
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
      <Topbar />

      {/* Encabezado */}
      <section className="border-b border-ink/10 bg-ink py-16 text-paper">
        <Container>
          <p className="kicker text-paper/40">Sumate a la red</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-light leading-tight tracking-[-0.01em] sm:text-5xl">
            Aplicá a la Red Sinnergia.
          </h1>
          <p className="mt-5 max-w-xl text-paper/60">
            Contanos quién sos y qué resolvés. Curamos cada perfil a mano para
            conectarte con las empresas correctas.
          </p>
        </Container>
      </section>

      {/* Formulario */}
      <Container className="max-w-3xl py-16">
        <form onSubmit={submit} className="space-y-12">
          {/* Identidad */}
          <fieldset className="space-y-6">
            <legend className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              01 · Datos de contacto
            </legend>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nombre y apellido / Estudio" required>
                <TextInput
                  required
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej. Nicolás Ferraro"
                />
              </Field>
              <Field label="Email" required>
                <TextInput
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="tu@email.com"
                />
              </Field>
              <Field label="WhatsApp">
                <TextInput
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="+54 9 11 …"
                />
              </Field>
              <Field label="Portfolio (URL)">
                <TextInput
                  value={form.portfolioUrl}
                  onChange={(e) => set("portfolioUrl", e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="LinkedIn">
                <TextInput
                  value={form.linkedin}
                  onChange={(e) => set("linkedin", e.target.value)}
                  placeholder="in/usuario"
                />
              </Field>
              <Field label="Instagram">
                <TextInput
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  placeholder="@usuario"
                />
              </Field>
            </div>
          </fieldset>

          {/* Perfil */}
          <fieldset className="space-y-6">
            <legend className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              02 · Tu perfil
            </legend>
            <Field label="Rol principal / titular" required>
              <TextInput
                required
                value={form.titular}
                onChange={(e) => set("titular", e.target.value)}
                placeholder="Ej. Filmmaker · Paid Media · Diseñador"
              />
            </Field>
            <Field label="Descripción breve" hint="2-3 líneas sobre lo que hacés." required>
              <TextArea
                required
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Contá tu especialidad, tu enfoque y tu experiencia."
              />
            </Field>
            <Field label="Especialidades" hint="Elegí todas las que apliquen." required>
              <MultiChips
                values={form.roles}
                onChange={(v) => set("roles", v)}
                options={ROLES}
              />
            </Field>
            <Field label="Rubros en los que trabajás">
              <MultiChips
                values={form.rubros}
                onChange={(v) => set("rubros", v)}
                options={RUBROS}
              />
            </Field>
          </fieldset>

          {/* Condiciones */}
          <fieldset className="space-y-6">
            <legend className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              03 · Modalidad y condiciones
            </legend>
            <Field label="Experiencia" required>
              <ChoiceChips
                value={form.experiencia}
                onChange={(v) => set("experiencia", v)}
                options={EXPERIENCIAS}
              />
            </Field>
            <Field label="Honorarios orientativos" required>
              <ChoiceChips
                value={form.honorarios}
                onChange={(v) => set("honorarios", v)}
                options={PRESUPUESTOS}
              />
            </Field>
            <Field label="Modalidad" required>
              <ChoiceChips
                value={form.modalidad}
                onChange={(v) => set("modalidad", v)}
                options={MODALIDADES}
              />
            </Field>
            <Field label="Disponibilidad" required>
              <ChoiceChips
                value={form.disponibilidad}
                onChange={(v) => set("disponibilidad", v)}
                options={DISPONIBILIDADES}
              />
            </Field>
          </fieldset>

          {/* Cuenta */}
          <fieldset className="space-y-6">
            <legend className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              04 · Creá tu cuenta
            </legend>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Contraseña"
                required
                hint={
                  form.password.length > 0 && !passwordOk
                    ? `⚠ ${PASSWORD_HINT}`
                    : PASSWORD_HINT
                }
              >
                <TextInput
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
              </Field>
              <Field
                label="Confirmar contraseña"
                required
                hint={
                  form.confirmPassword.length > 0 && !passwordsMatch
                    ? "⚠ Las contraseñas no coinciden"
                    : undefined
                }
              >
                <TextInput
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                />
              </Field>
            </div>
          </fieldset>

          <div className="flex flex-col items-start gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink/45">
              {error ? (
                <span className="text-ink">⚠ {error}</span>
              ) : (
                "Al enviar, tu perfil queda pendiente de aprobación por el equipo de Sinnergia."
              )}
            </p>
            <button
              type="submit"
              disabled={pending || !passwordOk || !passwordsMatch}
              className="inline-flex items-center bg-ink px-8 py-4 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Enviar aplicación"}
            </button>
          </div>
        </form>
      </Container>
    </main>
  );
}
