"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminPageHeader, Badge, Card, estadoVariant } from "@/components/admin/ui";
import { Field, TextArea } from "@/components/ui/Form";
import { updateLeadAction } from "@/lib/actions";
import { ESTADO_LEAD_LABEL } from "@/lib/catalogs";
import type { EstadoLead } from "@/lib/types";
import { AgendarSesion, type MeetingRow } from "@/components/admin/AgendarSesion";
import { AdminAccountPanel, type AccountInfo } from "@/components/admin/AdminAccountPanel";

const ESTADOS_LEAD: EstadoLead[] = [
  "nuevo",
  "en_conversacion",
  "propuesta_enviada",
  "cerrado_ganado",
  "cerrado_perdido",
];

type Diag = {
  id: string;
  objetivos: string;
  presupuesto: string;
  facturacion: string | null;
  equipoActual: string | null;
  problemaPrincipal: string;
  estadoLead: EstadoLead;
  notas: string | null;
  createdAt: string | Date;
};

type Company = {
  id: string;
  nombre: string;
  rubro: string;
  tamano: string | null;
  contacto: string;
  email: string;
  telefono: string | null;
  sitioWeb: string | null;
  origen: string | null;
  diagnoses: Diag[];
};

function formatFecha(value: string | Date) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function EmpresaDetail({
  company,
  meetings,
  calendarConnected,
  account,
}: {
  company: Company;
  meetings: MeetingRow[];
  calendarConnected: boolean;
  account: AccountInfo;
}) {
  const diag = company.diagnoses[0];
  const [estadoLead, setEstadoLead] = useState<EstadoLead>(diag?.estadoLead ?? "nuevo");
  const [notas, setNotas] = useState(diag?.notas ?? "");
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  const save = () => {
    if (!diag) return;
    startTransition(async () => {
      await updateLeadAction(diag.id, { estadoLead, notas });
      setSaved(true);
    });
  };

  return (
    <>
      <Link href="/admin/empresas" className="mb-4 inline-block text-sm text-ink/50 hover:text-ink">
        ← Empresas
      </Link>

      <AdminPageHeader
        title={company.nombre}
        subtitle={`${company.rubro}${company.tamano ? ` · ${company.tamano} personas` : ""}`}
        actions={<Badge variant={estadoVariant(estadoLead)}>{ESTADO_LEAD_LABEL[estadoLead]}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <div className="mb-6 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Diagnóstico</h2>
            {diag && (
              <span className="text-xs text-ink/45">Recibido el {formatFecha(diag.createdAt)}</span>
            )}
          </div>
          {diag ? (
            <div className="space-y-5">
              <DataBlock label="Objetivos" value={diag.objetivos} />
              <div className="grid gap-5 sm:grid-cols-2">
                <DataBlock label="Presupuesto" value={diag.presupuesto} />
                <DataBlock label="Facturación" value={diag.facturacion ?? "—"} />
              </div>
              <DataBlock label="Equipo actual" value={diag.equipoActual ?? "—"} />
              <DataBlock label="Problema principal" value={diag.problemaPrincipal} />
            </div>
          ) : (
            <p className="text-sm text-ink/50">Esta empresa todavía no completó un diagnóstico.</p>
          )}

          {diag && (
            <div className="mt-8 border-t border-ink/10 pt-6">
              <span className="mb-2 block text-sm font-medium text-ink">Estado del lead</span>
              <div className="flex flex-wrap gap-2.5">
                {ESTADOS_LEAD.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setEstadoLead(e);
                      setSaved(false);
                    }}
                    className={`border px-4 py-2 text-sm transition-colors ${
                      estadoLead === e
                        ? "border-ink bg-ink text-paper"
                        : "border-ink/20 text-ink/80 hover:border-ink"
                    }`}
                  >
                    {ESTADO_LEAD_LABEL[e]}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <Field label="Notas internas">
                  <TextArea
                    value={notas}
                    onChange={(e) => {
                      setNotas(e.target.value);
                      setSaved(false);
                    }}
                    placeholder="Anotaciones del equipo sobre este lead…"
                  />
                </Field>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button onClick={save} className="bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85">
                  Guardar
                </button>
                {saved && <span className="text-sm text-ink/50">Guardado ✓</span>}
              </div>
            </div>
          )}
        </Card>

        <Card className="h-fit p-6">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Contacto</h2>
          <div className="space-y-4 text-sm">
            <Row label="Contacto" value={company.contacto} />
            <Row label="Email" value={company.email} />
            <Row label="Teléfono" value={company.telefono ?? "—"} />
            <Row label="Sitio web" value={company.sitioWeb ?? "—"} />
            <Row label="Rubro" value={company.rubro} />
            <Row label="Tamaño" value={company.tamano ?? "—"} />
            <Row label="Origen" value={company.origen ?? "—"} />
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <AgendarSesion
          companyId={company.id}
          diagnosisId={diag?.id}
          meetings={meetings}
          calendarConnected={calendarConnected}
        />
      </div>

      <div className="mt-4">
        <AdminAccountPanel account={account} />
      </div>
    </>
  );
}

function DataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.08em] text-ink/40">{label}</div>
      <p className="mt-1.5 text-ink/85">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink/5 pb-3 last:border-0">
      <span className="text-ink/45">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
