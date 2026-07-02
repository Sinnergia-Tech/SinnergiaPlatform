"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AdminPageHeader, Badge, Card, estadoVariant } from "@/components/admin/ui";
import { setProfessionalEstadoAction } from "@/lib/actions";
import { ESTADO_PROFESIONAL_LABEL, ROLES, EXPERIENCIAS } from "@/lib/catalogs";
import type { EstadoProfesional } from "@/lib/types";

type Prof = {
  id: string;
  nombre: string;
  titular: string;
  roles: string[];
  experiencia: string;
  modalidad: string;
  honorarios: string;
  estado: EstadoProfesional;
  destacado: boolean;
};

const ESTADOS: (EstadoProfesional | "todos")[] = [
  "todos",
  "pendiente",
  "aprobado",
  "rechazado",
  "oculto",
];

export function ProfesionalesTable({ initial }: { initial: Prof[] }) {
  const [list, setList] = useState<Prof[]>(initial);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("todos");
  const [rol, setRol] = useState<string>("todos");
  const [exp, setExp] = useState<string>("todos");
  const [, startTransition] = useTransition();

  const setEstadoOf = (id: string, nuevo: EstadoProfesional) => {
    setList((l) => l.map((p) => (p.id === id ? { ...p, estado: nuevo } : p)));
    startTransition(() => {
      setProfessionalEstadoAction(id, nuevo);
    });
  };

  const filtered = useMemo(
    () =>
      list.filter((p) => {
        if (estado !== "todos" && p.estado !== estado) return false;
        if (rol !== "todos" && !p.roles.includes(rol)) return false;
        if (exp !== "todos" && p.experiencia !== exp) return false;
        if (q && !`${p.nombre} ${p.titular}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [list, estado, rol, exp, q]
  );

  return (
    <>
      <AdminPageHeader
        title="Profesionales"
        subtitle={`${filtered.length} de ${list.length} perfiles`}
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o rol…"
            className="border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
          <FilterSelect value={estado} onChange={setEstado} options={ESTADOS} labelFor={(o) => (o === "todos" ? "Todos los estados" : ESTADO_PROFESIONAL_LABEL[o])} />
          <FilterSelect value={rol} onChange={setRol} options={["todos", ...ROLES]} labelFor={(o) => (o === "todos" ? "Todos los roles" : o)} />
          <FilterSelect value={exp} onChange={setExp} options={["todos", ...EXPERIENCIAS]} labelFor={(o) => (o === "todos" ? "Toda experiencia" : o)} />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.06em] text-ink/50">
              <th className="px-5 py-3 font-medium">Profesional</th>
              <th className="px-5 py-3 font-medium">Especialidades</th>
              <th className="px-5 py-3 font-medium">Exp.</th>
              <th className="px-5 py-3 font-medium">Modalidad</th>
              <th className="px-5 py-3 font-medium">Hon.</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-smoke/60">
                <td className="px-5 py-4">
                  <Link href={`/admin/profesionales/${p.id}`} className="font-medium hover:underline">
                    {p.nombre}
                  </Link>
                  <div className="text-xs text-ink/50">
                    {p.titular}
                    {p.destacado && <span className="ml-2 text-ink/40">★ destacado</span>}
                  </div>
                </td>
                <td className="px-5 py-4 text-ink/70">
                  {p.roles.slice(0, 2).join(", ")}
                  {p.roles.length > 2 && <span className="text-ink/40"> +{p.roles.length - 2}</span>}
                </td>
                <td className="px-5 py-4 text-ink/70">{p.experiencia}</td>
                <td className="px-5 py-4 text-ink/70">{p.modalidad}</td>
                <td className="px-5 py-4 text-ink/70">{p.honorarios}</td>
                <td className="px-5 py-4">
                  <Badge variant={estadoVariant(p.estado)}>{ESTADO_PROFESIONAL_LABEL[p.estado]}</Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {p.estado !== "aprobado" && (
                      <RowAction onClick={() => setEstadoOf(p.id, "aprobado")}>Aprobar</RowAction>
                    )}
                    {p.estado === "aprobado" && (
                      <RowAction onClick={() => setEstadoOf(p.id, "oculto")}>Ocultar</RowAction>
                    )}
                    {p.estado !== "rechazado" && (
                      <RowAction onClick={() => setEstadoOf(p.id, "rechazado")} subtle>Rechazar</RowAction>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/45">
                  No hay profesionales con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  labelFor,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labelFor: (o: string) => string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none border border-ink/20 bg-paper px-3 py-2.5 pr-9 text-sm outline-none focus:border-ink"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labelFor(o)}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">↓</span>
    </div>
  );
}

function RowAction({
  children,
  onClick,
  subtle,
}: {
  children: React.ReactNode;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-3 py-1.5 text-xs font-medium transition-colors ${
        subtle
          ? "border-ink/15 text-ink/50 hover:border-ink/40 hover:text-ink"
          : "border-ink text-ink hover:bg-ink hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
