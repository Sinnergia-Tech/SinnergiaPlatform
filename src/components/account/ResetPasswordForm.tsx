"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/lib/actions";
import { isPasswordValid, PASSWORD_HINT } from "@/lib/password-policy";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const passwordOk = isPasswordValid(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  if (!token) {
    return (
      <p className="text-center text-sm text-paper/70">
        Este enlace no es válido.{" "}
        <a href="/recuperar-contrasena" className="link-underline text-paper">
          Pedí uno nuevo
        </a>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-sm text-paper/70">Tu contraseña se actualizó correctamente.</p>
        <a
          href="/login?reset=1"
          className="mt-6 inline-flex w-full items-center justify-center bg-paper px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-paper/85"
        >
          Ir a iniciar sesión
        </a>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await resetPasswordAction({ token, password, confirmPassword });
    setPending(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError(res.error ?? "No se pudo restablecer la contraseña.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-paper/25 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper"
        />
        <p className="mt-1.5 text-xs text-paper/40">{PASSWORD_HINT}</p>
      </div>
      <input
        type="password"
        required
        autoComplete="new-password"
        placeholder="Confirmar nueva contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="w-full border border-paper/25 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper"
      />

      {error && <p className="text-sm text-paper/80">⚠ {error}</p>}

      <button
        type="submit"
        disabled={pending || !passwordOk || !passwordsMatch}
        className="w-full bg-paper px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-paper/85 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Restablecer contraseña"}
      </button>
    </form>
  );
}
