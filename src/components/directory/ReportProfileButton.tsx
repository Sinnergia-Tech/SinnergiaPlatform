"use client";

import { useEffect, useState } from "react";
import { reportProfileAction } from "@/lib/actions";
import { REPORTE_MOTIVOS } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

/**
 * Botón para reportar un perfil que parezca inapropiado o peligroso. Abre un
 * modal con motivo + detalle opcional. Sólo se muestra a usuarios logueados que
 * no sean el dueño del perfil (el server vuelve a validar todo).
 */
export function ReportProfileButton({ professionalId }: { professionalId: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState<string>(REPORTE_MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");
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
    const res = await reportProfileAction({ professionalId, motivo, detalle });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      setDetalle("");
      setMotivo(REPORTE_MOTIVOS[0]);
      toast.success(
        res.already
          ? "Ya habías reportado este perfil. Lo estamos revisando."
          : "Gracias. Vamos a revisar este perfil."
      );
    } else {
      toast.error(res.error ?? "No se pudo enviar el reporte.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink/40 underline-offset-4 transition-colors hover:text-ink hover:underline"
      >
        Reportar perfil
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-lg leading-none text-ink/50 hover:text-ink"
            >
              ✕
            </button>

            <h3 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
              Reportar perfil
            </h3>
            <p className="mt-2 text-sm text-ink/60">
              Contanos qué pasa con este perfil. El equipo de Sinnergia lo va a revisar.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-ink/50">Motivo</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
                >
                  {REPORTE_MOTIVOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-ink/50">Detalle (opcional)</label>
                  <span className="text-xs text-ink/35">{detalle.length}/500</span>
                </div>
                <textarea
                  value={detalle}
                  maxLength={500}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Agregá contexto si querés…"
                  className="min-h-[80px] w-full resize-y border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink"
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
                  disabled={pending}
                  className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
                >
                  {pending ? "Enviando…" : "Enviar reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
