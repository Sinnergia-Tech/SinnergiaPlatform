"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, Badge, Card, estadoVariant } from "@/components/admin/ui";
import { CONTACT_STATUS_LABEL } from "@/lib/catalogs";

type Row = {
  id: string;
  empresa: { id: string; nombre: string };
  freelancer: { id: string; nombre: string };
  status: string;
  createdAt: string | Date;
};

type TopEmpresa = { id: string; nombre: string; count: number };

function formatFecha(value: string | Date) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function ContactosTable({
  initial,
  topEmpresas,
}: {
  initial: Row[];
  topEmpresas: TopEmpresa[];
}) {
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      initial.filter(
        (r) =>
          !q ||
          `${r.empresa.nombre} ${r.freelancer.nombre}`.toLowerCase().includes(q.toLowerCase())
      ),
    [initial, q]
  );

  return (
    <>
      <AdminPageHeader
        title="Contactos"
        subtitle={`${initial.length} contacto(s) empresa → freelancer`}
      />

      {topEmpresas.length > 0 && (
        <Card className="mb-4 p-6">
          <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
            Empresas más activas
          </h2>
          <p className="mt-1 text-xs text-ink/45">
            Volumen de contactos enviados — para detectar posible spam. Entrá a la
            empresa para intervenir (suspender la cuenta).
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {topEmpresas.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3">
                <Link href={`/admin/empresas/${e.id}`} className="font-medium hover:underline">
                  {e.nombre}
                </Link>
                <span className="text-ink/50">{e.count} contacto(s)</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar empresa o freelancer…"
          className="w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        />
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.06em] text-ink/50">
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Freelancer</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink/5 last:border-0 hover:bg-smoke/60">
                <td className="px-5 py-4">
                  <Link href={`/admin/empresas/${r.empresa.id}`} className="font-medium hover:underline">
                    {r.empresa.nombre}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/profesionales/${r.freelancer.id}`}
                    className="text-ink/80 hover:underline"
                  >
                    {r.freelancer.nombre}
                  </Link>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-ink/70">{formatFecha(r.createdAt)}</td>
                <td className="px-5 py-4">
                  <Badge variant={estadoVariant(r.status)}>
                    {CONTACT_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink/45">
                  {initial.length === 0 ? "Todavía no hay contactos." : "Sin resultados."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
