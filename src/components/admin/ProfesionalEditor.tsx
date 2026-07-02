"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminPageHeader, Badge, Card, estadoVariant } from "@/components/admin/ui";
import { Field, TextInput, TextArea, ChoiceChips, MultiChips } from "@/components/ui/Form";
import {
  setProfessionalEstadoAction,
  setProfessionalDestacadoAction,
  saveProfessionalAction,
} from "@/lib/actions";
import {
  ESTADO_PROFESIONAL_LABEL,
  ROLES,
  RUBROS,
  EXPERIENCIAS,
  MODALIDADES,
  PRESUPUESTOS,
  DISPONIBILIDADES,
} from "@/lib/catalogs";
import type { EstadoProfesional } from "@/lib/types";

type Prof = {
  id: string;
  nombre: string;
  titular: string;
  descripcion: string;
  roles: string[];
  rubros: string[];
  experiencia: string;
  honorarios: string;
  modalidad: string;
  disponibilidad: string;
  estado: EstadoProfesional;
  destacado: boolean;
  email: string;
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  portfolioUrl: string | null;
};

export function ProfesionalEditor({ initial }: { initial: Prof }) {
  const [p, setP] = useState<Prof>(initial);
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  const set = <K extends keyof Prof>(k: K, v: Prof[K]) => {
    setP({ ...p, [k]: v });
    setSaved(false);
  };

  const setEstado = (estado: EstadoProfesional) => {
    setP((prev) => ({ ...prev, estado }));
    startTransition(() => setProfessionalEstadoAction(p.id, estado));
  };

  const toggleDestacado = () => {
    const next = !p.destacado;
    setP((prev) => ({ ...prev, destacado: next }));
    startTransition(() => setProfessionalDestacadoAction(p.id, next));
  };

  const save = () => {
    startTransition(async () => {
      await saveProfessionalAction(p.id, {
        nombre: p.nombre,
        titular: p.titular,
        descripcion: p.descripcion,
        roles: p.roles,
        rubros: p.rubros,
        experiencia: p.experiencia,
        honorarios: p.honorarios,
        modalidad: p.modalidad,
        disponibilidad: p.disponibilidad,
        email: p.email,
        whatsapp: p.whatsapp,
        linkedin: p.linkedin,
        instagram: p.instagram,
        portfolioUrl: p.portfolioUrl,
      });
      setSaved(true);
    });
  };

  return (
    <>
      <Link href="/admin/profesionales" className="mb-4 inline-block text-sm text-ink/50 hover:text-ink">
        ← Profesionales
      </Link>

      <AdminPageHeader
        title={p.nombre}
        subtitle={p.titular}
        actions={<Badge variant={estadoVariant(p.estado)}>{ESTADO_PROFESIONAL_LABEL[p.estado]}</Badge>}
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-medium text-ink/60">Moderación:</span>
        <ModBtn active={p.estado === "aprobado"} onClick={() => setEstado("aprobado")}>Aprobar</ModBtn>
        <ModBtn active={p.estado === "oculto"} onClick={() => setEstado("oculto")}>Ocultar</ModBtn>
        <ModBtn active={p.estado === "rechazado"} onClick={() => setEstado("rechazado")}>Rechazar</ModBtn>
        <div className="mx-1 h-5 w-px bg-ink/15" />
        <ModBtn active={p.destacado} onClick={toggleDestacado}>
          {p.destacado ? "★ Destacado" : "Destacar"}
        </ModBtn>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Datos del perfil</h2>
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Nombre"><TextInput value={p.nombre} onChange={(e) => set("nombre", e.target.value)} /></Field>
              <Field label="Rol / titular"><TextInput value={p.titular} onChange={(e) => set("titular", e.target.value)} /></Field>
            </div>
            <Field label="Descripción">
              <TextArea value={p.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
            </Field>
            <Field label="Especialidades">
              <MultiChips values={p.roles} onChange={(v) => set("roles", v)} options={ROLES} />
            </Field>
            <Field label="Rubros">
              <MultiChips values={p.rubros} onChange={(v) => set("rubros", v)} options={RUBROS} />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Experiencia">
                <ChoiceChips value={p.experiencia} onChange={(v) => set("experiencia", v)} options={EXPERIENCIAS} />
              </Field>
              <Field label="Honorarios">
                <ChoiceChips value={p.honorarios} onChange={(v) => set("honorarios", v)} options={PRESUPUESTOS} />
              </Field>
              <Field label="Modalidad">
                <ChoiceChips value={p.modalidad} onChange={(v) => set("modalidad", v)} options={MODALIDADES} />
              </Field>
              <Field label="Disponibilidad">
                <ChoiceChips value={p.disponibilidad} onChange={(v) => set("disponibilidad", v)} options={DISPONIBILIDADES} />
              </Field>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 border-t border-ink/10 pt-6">
            <button onClick={save} className="bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink/85">
              Guardar cambios
            </button>
            {saved && <span className="text-sm text-ink/50">Guardado ✓</span>}
          </div>
        </Card>

        <Card className="h-fit p-6">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">Contacto</h2>
          <div className="space-y-4">
            <Field label="Email"><TextInput value={p.email} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="WhatsApp"><TextInput value={p.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
            <Field label="LinkedIn"><TextInput value={p.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} /></Field>
            <Field label="Instagram"><TextInput value={p.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} /></Field>
            <Field label="Portfolio"><TextInput value={p.portfolioUrl ?? ""} onChange={(e) => set("portfolioUrl", e.target.value)} /></Field>
          </div>
        </Card>
      </div>
    </>
  );
}

function ModBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-ink/25 text-ink/70 hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
