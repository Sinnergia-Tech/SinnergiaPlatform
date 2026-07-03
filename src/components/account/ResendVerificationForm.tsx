"use client";

import { useState } from "react";
import { resendVerificationAction } from "@/lib/actions";

export function ResendVerificationForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await resendVerificationAction(email);
    setMessage(res.message);
    setPending(false);
  };

  if (message) {
    return <p className="mt-8 text-sm text-paper/70">{message}</p>;
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      <input
        type="email"
        required
        placeholder="Tu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-paper/25 bg-transparent px-4 py-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/40 focus:border-paper"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-paper px-6 py-3.5 text-sm font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:bg-paper/85 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Reenviar verificación"}
      </button>
    </form>
  );
}
