"use client";

import { useState, useTransition } from "react";
import { contactFreelancerAction } from "@/lib/actions";

const ACTIVE_STATUSES = new Set(["pending", "accepted"]);

export function ContactarFreelancerButton({
  professionalId,
  initialStatus,
  label = "Contactar freelancer",
  variant = "solid",
}: {
  professionalId: string;
  initialStatus?: string | null;
  label?: string;
  variant?: "solid" | "outline";
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(
    initialStatus ? ACTIVE_STATUSES.has(initialStatus) : false
  );
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await contactFreelancerAction(professionalId);
      if (res.ok) {
        setSent(true);
      } else {
        setError(res.error ?? "No se pudo enviar la solicitud.");
      }
    });
  };

  const base =
    "inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-60";
  const styles =
    variant === "solid"
      ? "bg-ink text-paper hover:bg-ink/85"
      : "border border-ink text-ink hover:bg-ink hover:text-paper";

  if (error) {
    return <p className="text-xs text-red-500">⚠ {error}</p>;
  }

  return (
    <button onClick={onClick} disabled={pending || sent} className={`${base} ${styles}`}>
      {sent ? "Solicitud enviada ✓" : pending ? "Enviando…" : label}
    </button>
  );
}
