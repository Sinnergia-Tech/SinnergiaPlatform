"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFreelancerSocialsAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

const inputCls =
  "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

export function SocialLinksEditor({
  initial,
}: {
  initial: { instagram: string | null; facebook: string | null; linkedin: string | null };
}) {
  const router = useRouter();
  const toast = useToast();
  const [instagram, setInstagram] = useState(initial.instagram ?? "");
  const [facebook, setFacebook] = useState(initial.facebook ?? "");
  const [linkedin, setLinkedin] = useState(initial.linkedin ?? "");
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const res = await updateFreelancerSocialsAction({ instagram, facebook, linkedin });
      if (res.ok) {
        toast.success("Redes guardadas");
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudieron guardar las redes.");
      }
    });
  };

  return (
    <section className="border border-ink/10 bg-paper p-6">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Redes</h2>
      <p className="mt-1 text-xs text-ink/45">
        Pegá el link completo de tus perfiles. Aparecen como íconos en tu perfil público.
      </p>
      <div className="mt-5 grid max-w-md gap-3">
        <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/tuusuario" />
        <Field label="Facebook" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/tuusuario" />
        <Field label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/tuusuario" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar redes"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}
