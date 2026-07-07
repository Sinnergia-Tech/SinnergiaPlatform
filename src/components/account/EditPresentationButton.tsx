"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFreelancerProfileAction } from "@/lib/actions";
import { ROLES, EXPERIENCIAS, MODALIDADES, DISPONIBILIDADES } from "@/lib/catalogs";
import { useToast } from "@/components/ui/Toast";

const LIMITS = { nombre: 80, titular: 80, descripcion: 500 };

const inputCls =
  "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink";
const selectCls = `${inputCls} appearance-none`;

type Initial = {
  nombre: string;
  titular: string;
  descripcion: string;
  roles: string[];
  experiencia: string;
  modalidad: string;
  disponibilidad: string;
};

export function EditPresentationButton({ initial }: { initial: Initial }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-ink/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
      >
        Editar
      </button>
      {open && <EditModal initial={initial} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditModal({ initial, onClose }: { initial: Initial; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [nombre, setNombre] = useState(initial.nombre);
  const [titular, setTitular] = useState(initial.titular);
  const [descripcion, setDescripcion] = useState(initial.descripcion);
  const [roles, setRoles] = useState<string[]>(initial.roles);
  const [experiencia, setExperiencia] = useState(initial.experiencia);
  const [modalidad, setModalidad] = useState(initial.modalidad);
  const [disponibilidad, setDisponibilidad] = useState(initial.disponibilidad);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggleRole = (r: string) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const valid =
    nombre.trim().length > 0 &&
    titular.trim().length > 0 &&
    descripcion.trim().length > 0 &&
    roles.length > 0;

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateFreelancerProfileAction({
        nombre,
        titular,
        descripcion,
        roles,
        experiencia,
        modalidad,
        disponibilidad,
      });
      if (res.ok) {
        toast.success("Presentación actualizada");
        onClose();
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-lg leading-none text-ink/50 hover:text-ink"
        >
          ✕
        </button>

        <h3 className="text-lg font-semibold">Editar presentación</h3>

        <div className="mt-5 space-y-4">
          <Labeled label="Nombre" counter={`${nombre.length}/${LIMITS.nombre}`}>
            <input value={nombre} maxLength={LIMITS.nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
          </Labeled>

          <Labeled label="Titular" counter={`${titular.length}/${LIMITS.titular}`}>
            <input
              value={titular}
              maxLength={LIMITS.titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="Ej. Filmmaker"
              className={inputCls}
            />
          </Labeled>

          <Labeled label="Descripción" counter={`${descripcion.length}/${LIMITS.descripcion}`}>
            <textarea
              value={descripcion}
              maxLength={LIMITS.descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={`${inputCls} min-h-[90px] resize-y`}
            />
          </Labeled>

          <div>
            <span className="mb-1.5 block text-xs text-ink/50">Roles (elegí al menos uno)</span>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRole(r)}
                  className={`border px-3 py-1.5 text-xs transition-colors ${
                    roles.includes(r)
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 text-ink/70 hover:border-ink"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Experiencia" value={experiencia} onChange={setExperiencia} options={EXPERIENCIAS} />
            <SelectField label="Modalidad" value={modalidad} onChange={setModalidad} options={MODALIDADES} />
            <SelectField label="Disponibilidad" value={disponibilidad} onChange={setDisponibilidad} options={DISPONIBILIDADES} />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-ink">⚠ {error}</p>}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending || !valid}
            className="bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button type="button" onClick={onClose} className="px-3 py-3 text-sm text-ink/50 hover:text-ink">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function Labeled({
  label,
  counter,
  children,
}: {
  label: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-ink/50">{label}</span>
        {counter && <span className="text-xs text-ink/35">{counter}</span>}
      </div>
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink/50">{label}</span>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">↓</span>
      </div>
    </label>
  );
}
