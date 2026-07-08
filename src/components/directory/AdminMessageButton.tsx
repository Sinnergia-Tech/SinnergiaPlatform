"use client";

import { useEffect, useState } from "react";
import { adminMessageProfessionalAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

/**
 * Botón (solo admin) para enviarle un mensaje por email a un freelancer desde su
 * perfil en /red. Es contacto supervisorio del equipo, no el flujo de empresa.
 */
export function AdminMessageButton({
  professionalId,
  nombre,
}: {
  professionalId: string;
  nombre: string;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await adminMessageProfessionalAction({ professionalId, subject, body });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      setSubject("");
      setBody("");
      toast.success("Mensaje enviado por email.");
    } else {
      toast.error(res.error ?? "No se pudo enviar el mensaje.");
    }
  };

  const inputCls =
    "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        Enviar mensaje
      </button>
      <p className="mt-1.5 text-xs text-ink/40">Contacto del equipo (por email)</p>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-md bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-lg leading-none text-ink/50 hover:text-ink"
            >
              ✕
            </button>
            <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              Enviar mensaje
            </h3>
            <p className="mt-2 text-sm text-ink/60">
              Le llega por email a <span className="font-medium text-ink/80">{nombre}</span> de
              parte del equipo de Sinnergia.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-ink/50">Asunto</label>
                <input
                  required
                  maxLength={150}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del mensaje"
                  className={inputCls}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-ink/50">Mensaje</label>
                  <span className="text-xs text-ink/35">{body.length}/3000</span>
                </div>
                <textarea
                  required
                  maxLength={3000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Escribí tu mensaje…"
                  className={`${inputCls} min-h-[140px] resize-y`}
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs uppercase tracking-[0.1em] text-ink/50 hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending || !subject.trim() || !body.trim()}
                  className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
                >
                  {pending ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
