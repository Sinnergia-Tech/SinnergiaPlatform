"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleMeetingAction } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";

const DURACIONES = [30, 45, 60, 90];

const input =
  "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-ink";

export function NuevaSesionButton({
  companies,
}: {
  companies: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState(45);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = companies.filter((c) =>
    c.nombre.toLowerCase().includes(query.trim().toLowerCase())
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !fecha || !hora) return;
    setPending(true);
    const res = await scheduleMeetingAction({ companyId, fecha, hora, duracionMin: duracion });
    setPending(false);
    if (res.ok) {
      setOpen(false);
      setCompanyId("");
      setQuery("");
      setFecha("");
      setHora("");
      toast.success("Sesión agendada. Se invitó a la empresa por mail.");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo agendar la sesión.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85"
      >
        Agendar sesión
      </button>

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
              Agendar sesión
            </h3>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="relative">
                <label className="mb-1 block text-xs text-ink/50">Empresa</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCompanyId("");
                    setOpenList(true);
                  }}
                  onFocus={() => setOpenList(true)}
                  onBlur={() => setTimeout(() => setOpenList(false), 120)}
                  placeholder="Buscá una empresa…"
                  autoComplete="off"
                  className={input}
                />
                {openList && filtered.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto border border-ink/20 bg-paper shadow-lg">
                    {filtered.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCompanyId(c.id);
                            setQuery(c.nombre);
                            setOpenList(false);
                          }}
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-smoke ${
                            companyId === c.id ? "bg-smoke font-medium" : "text-ink/80"
                          }`}
                        >
                          {c.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {openList && query.trim() && filtered.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full border border-ink/20 bg-paper px-3 py-2 text-sm text-ink/45">
                    Sin resultados
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-ink/50">Fecha</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink/50">Hora</label>
                  <input
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className={input}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink/50">Duración</label>
                <select
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                  className={input}
                >
                  {DURACIONES.map((d) => (
                    <option key={d} value={d}>
                      {d} minutos
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs uppercase tracking-[0.1em] text-ink/50 hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending || !companyId || !fecha || !hora}
                  className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
                >
                  {pending ? "Agendando…" : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
