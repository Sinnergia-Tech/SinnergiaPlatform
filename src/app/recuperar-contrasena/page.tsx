"use client";

import { useState } from "react";
import { requestPasswordResetAction } from "@/lib/actions";

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await requestPasswordResetAction(email);
    setMessage(res.message);
    setPending(false);
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
          <h1 className="mt-6 text-2xl font-light">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-paper/50">
            Te mandamos un enlace para restablecerla.
          </p>
        </div>

        {message ? (
          <p className="text-center text-sm text-paper/70">{message}</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              name="email"
              required
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-paper/25 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-paper px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-paper/85 disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-paper/35">
          <a href="/login" className="link-underline text-paper/60">
            Volver a iniciar sesión
          </a>
        </p>
      </div>
    </main>
  );
}
