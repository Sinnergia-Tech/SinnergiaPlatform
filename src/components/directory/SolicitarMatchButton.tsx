"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { solicitarMatchAction } from "@/lib/actions";

export function SolicitarMatchButton({
  professionalId,
  label = "Solicitar Match",
  variant = "solid",
}: {
  professionalId: string;
  label?: string;
  variant?: "solid" | "outline";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const onClick = () => {
    startTransition(async () => {
      const res = await solicitarMatchAction(professionalId);
      if ("redirect" in res && res.redirect) {
        router.push(res.redirect);
        return;
      }
      if (res.ok) {
        setDone(true);
        router.push("/cuenta");
      }
    });
  };

  const base =
    "inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors disabled:opacity-60";
  const styles =
    variant === "solid"
      ? "bg-ink text-paper hover:bg-ink/85"
      : "border border-ink text-ink hover:bg-ink hover:text-paper";

  return (
    <button onClick={onClick} disabled={pending || done} className={`${base} ${styles}`}>
      {done ? "Solicitado ✓" : pending ? "Enviando…" : label}
    </button>
  );
}
