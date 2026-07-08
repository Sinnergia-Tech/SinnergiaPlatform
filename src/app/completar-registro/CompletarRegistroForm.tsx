"use client";

import { useState } from "react";
import { completeGoogleRegistrationAction } from "@/lib/actions";
import { RUBROS, ROLES } from "@/lib/catalogs";

type Tipo = "freelancer" | "empresa";

const baseInput =
  "w-full border bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper";
const okBorder = "border-paper/25";
const errBorder = "border-red-400 focus:border-red-400";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-ink" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function CompletarRegistroForm({
  token,
  nombre: googleName,
}: {
  token: string;
  nombre: string;
}) {
  const [tipo, setTipo] = useState<Tipo>("freelancer");
  const [nombre, setNombre] = useState(googleName);
  const [contacto, setContacto] = useState(googleName);
  const [titular, setTitular] = useState("");
  const [rubro, setRubro] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  // Al cambiar de tipo, el "nombre" cambia de significado (persona vs empresa),
  // así que reajustamos qué precargamos con el nombre de Google.
  const chooseTipo = (t: Tipo) => {
    setTipo(t);
    setError(null);
    if (t === "freelancer") {
      setNombre(googleName);
    } else {
      setNombre(""); // el nombre de la empresa lo escribe el usuario
      setContacto(googleName);
    }
  };

  const fieldErrors: Partial<Record<string, string>> = {};
  if (!nombre.trim()) fieldErrors.nombre = "Este campo es obligatorio";
  if (tipo === "empresa" && !contacto.trim()) fieldErrors.contacto = "Este campo es obligatorio";
  if (tipo === "freelancer" && !titular) fieldErrors.titular = "Elegí un rol principal";
  if (tipo === "empresa" && !rubro) fieldErrors.rubro = "Elegí un rubro";

  const showError = (field: string) => attempted && fieldErrors[field];
  const cls = (field: string) => `${baseInput} ${showError(field) ? errBorder : okBorder}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setError(null);
    if (Object.keys(fieldErrors).length > 0) return;

    setPending(true);
    const res = await completeGoogleRegistrationAction(
      tipo === "freelancer"
        ? { token, tipo, nombre, titular }
        : { token, tipo, nombre, contacto, rubro }
    );
    // El éxito redirige (a Google y de vuelta, ya logueado). Si volvemos acá es
    // porque hubo un error.
    if (res && res.ok === false) {
      setError(res.error);
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-16 text-paper">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/isotipo-blanco.png" alt="Sinnergia" className="h-12 w-12 object-contain" />
          <h1 className="mt-6 text-2xl font-light">Completá tu registro</h1>
          <p className="mt-2 text-sm text-paper/50">
            Entrás con Google. Solo falta contarnos quién sos.
          </p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-3">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => chooseTipo("freelancer")}
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
              onClick={() => chooseTipo("empresa")}
              className={`border px-4 py-3 text-sm font-medium uppercase tracking-[0.08em] transition-colors ${
                tipo === "empresa"
                  ? "border-paper bg-paper text-ink"
                  : "border-paper/25 text-paper/70 hover:border-paper"
              }`}
            >
              Empresa
            </button>
          </div>

          {/* Nombre (persona o empresa según tipo) */}
          <div>
            <input
              placeholder={tipo === "freelancer" ? "Nombre y apellido" : "Nombre de la empresa"}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={cls("nombre")}
            />
            {showError("nombre") && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.nombre}</p>}
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

          {tipo === "freelancer" ? (
            <div>
              <select
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                className={`${cls("titular")} appearance-none ${titular ? "text-paper" : "text-paper/40"}`}
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
              {showError("titular") && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.titular}</p>}
            </div>
          ) : (
            <div>
              <select
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                className={`${cls("rubro")} appearance-none ${rubro ? "text-paper" : "text-paper/40"}`}
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
              {showError("rubro") && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.rubro}</p>}
            </div>
          )}

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

        <p className="mt-8 text-center text-xs text-paper/35">
          <a href="/login" className="link-underline text-paper/60">
            Cancelar
          </a>
        </p>
      </div>
    </main>
  );
}
