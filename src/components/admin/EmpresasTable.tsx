"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, Badge, Card, estadoVariant } from "@/components/admin/ui";
import { ESTADO_LEAD_LABEL } from "@/lib/catalogs";
import type { EstadoLead } from "@/lib/types";

type Row = {
  id: string;
  nombre: string;
  contacto: string;
  rubro: string;
  tamano: string | null;
  diagnoses: { estadoLead: EstadoLead; presupuesto: string }[];
};

const ESTADOS = [
  "todos",
  "nuevo",
  "en_conversacion",
  "propuesta_enviada",
  "cerrado_ganado",
  "cerrado_perdido",
];

export function EmpresasTable({ initial }: { initial: Row[] }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");

  const rows = useMemo(
    () =>
      initial.filter((c) => {
        const diag = c.diagnoses[0];
        if (estado !== "todos" && diag?.estadoLead !== estado) return false;
        if (q && !`${c.nombre} ${c.rubro}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [initial, q, estado]
  );

  return (
    <>
      <AdminPageHeader
        title="Empresas & Diagnósticos"
        subtitle={`${rows.length} de ${initial.length} empresas`}
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar empresa o rubro…"
            className="border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
          <div className="relative">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full appearance-none border border-ink/20 bg-paper px-3 py-2.5 pr-9 text-sm outline-none focus:border-ink"
            >
              {ESTADOS.map((o) => (
                <option key={o} value={o}>
                  {o === "todos" ? "Todos los estados" : ESTADO_LEAD_LABEL[o]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">↓</span>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.06em] text-ink/50">
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Rubro</th>
              <th className="px-5 py-3 font-medium">Tamaño</th>
              <th className="px-5 py-3 font-medium">Presupuesto</th>
              <th className="px-5 py-3 font-medium">Estado del lead</th>
              <th className="px-5 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const diag = c.diagnoses[0];
              return (
                <tr key={c.id} className="border-b border-ink/5 last:border-0 hover:bg-smoke/60">
                  <td className="px-5 py-4">
                    <Link href={`/admin/empresas/${c.id}`} className="font-medium hover:underline">
                      {c.nombre}
                    </Link>
                    <div className="text-xs text-ink/50">{c.contacto}</div>
                  </td>
                  <td className="px-5 py-4 text-ink/70">{c.rubro}</td>
                  <td className="px-5 py-4 text-ink/70">{c.tamano ?? "—"}</td>
                  <td className="px-5 py-4 text-ink/70">{diag?.presupuesto ?? "—"}</td>
                  <td className="px-5 py-4">
                    {diag ? (
                      <Badge variant={estadoVariant(diag.estadoLead)}>{ESTADO_LEAD_LABEL[diag.estadoLead]}</Badge>
                    ) : (
                      <span className="text-ink/40">Sin diagnóstico</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/empresas/${c.id}`} className="border border-ink px-3 py-1.5 text-xs font-medium hover:bg-ink hover:text-paper">
                      Ver
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/45">
                  No hay empresas con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
