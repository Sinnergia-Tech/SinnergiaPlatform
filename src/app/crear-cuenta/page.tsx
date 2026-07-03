"use client";

import { useState } from "react";
import { registerAccountAction } from "@/lib/actions";
import { isPasswordValid, PASSWORD_HINT } from "@/lib/password-policy";
import { RUBROS, ROLES } from "@/lib/catalogs";

type Tipo = "freelancer" | "empresa";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const baseInput =
  "w-full border bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper";
const okBorder = "border-paper/25";
const errBorder = "border-red-400 focus:border-red-400";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-ink"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function CrearCuentaPage() {
  const [tipo, setTipo] = useState<Tipo>("freelancer");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [titular, setTitular] = useState("");
  const [rubro, setRubro] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const passwordOk = isPasswordValid(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const fieldErrors: Partial<Record<string, string>> = {};
  if (!nombre.trim()) fieldErrors.nombre = "Este campo es obligatorio";
  if (tipo === "empresa" && !contacto.trim()) fieldErrors.contacto = "Este campo es obligatorio";
  if (!email.trim()) fieldErrors.email = "Este campo es obligatorio";
  else if (!EMAIL_REGEX.test(email)) fieldErrors.email = "El email no es válido";
  if (tipo === "freelancer" && !titular) fieldErrors.titular = "Elegí un rol principal";
  if (tipo === "empresa" && !rubro) fieldErrors.rubro = "Elegí un rubro";
  if (!password) fieldErrors.password = "Este campo es obligatorio";
  else if (!passwordOk) fieldErrors.password = PASSWORD_HINT;
  if (!confirmPassword) fieldErrors.confirmPassword = "Este campo es obligatorio";
  else if (!passwordsMatch) fieldErrors.confirmPassword = "Las contraseñas no coinciden";

  const showError = (field: string) => attempted && fieldErrors[field];
  const cls = (field: string) => `${baseInput} ${showError(field) ? errBorder : okBorder}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (Object.keys(fieldErrors).length > 0) return;

    setPending(true);
    const res = await registerAccountAction(
      tipo === "freelancer"
        ? { tipo, nombre, email, titular, password, confirmPassword }
        : { tipo, nombre, contacto, email, rubro, password, confirmPassword }
    );
    setPending(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError(res.error ?? "No se pudo crear la cuenta. Probá de nuevo.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-paper">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/isotipo-blanco.png"
            alt="Sinnergia"
            className="h-12 w-12 object-contain"
          />
          <h1 className="mt-6 text-2xl font-light">Creá tu cuenta</h1>
          <p className="mt-2 text-sm text-paper/50">
            Empezá con lo mínimo. Después completás tu perfil.
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-paper text-xl">
              ✓
            </div>
            <p className="mt-6 text-sm text-paper/70">
              Te mandamos un email para confirmar tu cuenta. Hacé click en el enlace
              para poder ingresar — hasta ese momento tu cuenta va a quedar sin activar.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("freelancer")}
                className={`border px-4 py-3 text-sm font-medium uppercase tracking-[0.08em] transition-colors ${
                  tipo === "freelancer"
                    ? "border-paper bg-paper text-ink"
                    : "border-paper/25 text-paper/70 hover:border-paper"
                }`}
              >
                Freelancer
              </button>
              <button
                type="button"
                onClick={() => setTipo("empresa")}
                className={`border px-4 py-3 text-sm font-medium uppercase tracking-[0.08em] transition-colors ${
                  tipo === "empresa"
                    ? "border-paper bg-paper text-ink"
                    : "border-paper/25 text-paper/70 hover:border-paper"
                }`}
              >
                Empresa
              </button>
            </div>

            <div>
              <input
                placeholder={tipo === "freelancer" ? "Nombre y apellido" : "Nombre de la empresa"}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={cls("nombre")}
              />
              {showError("nombre") && (
                <p className="mt-1.5 text-xs text-red-400">{fieldErrors.nombre}</p>
              )}
            </div>

            {tipo === "empresa" && (
              <div>
                <input
                  placeholder="Persona de contacto"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  className={cls("contacto")}
                />
                {showError("contacto") && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.contacto}</p>
                )}
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cls("email")}
              />
              {showError("email") && (
                <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {tipo === "freelancer" ? (
              <div>
                <div className="relative">
                  <select
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    className={`${cls("titular")} appearance-none ${
                      titular ? "text-paper" : "text-paper/40"
                    }`}
                  >
                    <option value="" disabled className="text-ink">
                      Rol principal
                    </option>
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="text-ink">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {showError("titular") && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.titular}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="relative">
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    className={`${cls("rubro")} appearance-none ${
                      rubro ? "text-paper" : "text-paper/40"
                    }`}
                  >
                    <option value="" disabled className="text-ink">
                      Rubro
                    </option>
                    {RUBROS.map((r) => (
                      <option key={r} value={r} className="text-ink">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {showError("rubro") && (
                  <p className="mt-1.5 text-xs text-red-400">{fieldErrors.rubro}</p>
                )}
              </div>
            )}

            <div>
              <input
                type="password"
                placeholder="Contraseña"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cls("password")}
              />
              <p className={`mt-1.5 text-xs ${showError("password") ? "text-red-400" : "text-paper/40"}`}>
                {showError("password") ? fieldErrors.password : PASSWORD_HINT}
              </p>
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirmar contraseña"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cls("confirmPassword")}
              />
              {showError("confirmPassword") && (
                <p className="mt-1.5 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {error && <p className="text-sm text-paper/80">⚠ {error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2.5 bg-paper px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-paper/85 disabled:opacity-70"
            >
              {pending && <Spinner />}
              {pending ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-paper/35">
          <a href="/login" className="link-underline text-paper/60">
            Ya tengo cuenta, iniciar sesión
          </a>
        </p>
      </div>
    </main>
  );
}
