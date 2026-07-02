"use client";

import { useState, useTransition } from "react";
import { AdminPageHeader, Badge, Card, estadoVariant } from "@/components/admin/ui";
import { setMatchEstadoAction, toggleCandidateAction } from "@/lib/actions";
import { ESTADO_MATCH_LABEL } from "@/lib/catalogs";
import type { EstadoMatch } from "@/lib/types";

type Cand = {
  professionalId: string;
  puntaje: number;
  seleccionado: boolean;
  professional: {
    nombre: string;
    titular: string;
    modalidad: string;
    honorarios: string;
  } | null;
};

type Match = {
  id: string;
  contexto: string;
  estado: EstadoMatch;
  resultado: string | null;
  company: { nombre: string } | null;
  candidatos: Cand[];
};

export function MatchesBoard({ initial }: { initial: Match[] }) {
  const [list, setList] = useState<Match[]>(initial);
  const [, startTransition] = useTransition();

  const setEstado = (id: string, estado: EstadoMatch) => {
    setList((l) => l.map((m) => (m.id === id ? { ...m, estado } : m)));
    startTransition(() => setMatchEstadoAction(id, estado));
  };

  const toggleCandidate = (matchId: string, profId: string) => {
    setList((l) =>
      l.map((m) =>
        m.id === matchId
          ? {
              ...m,
              candidatos: m.candidatos.map((c) =>
                c.professionalId === profId ? { ...c, seleccionado: !c.seleccionado } : c
              ),
            }
          : m
      )
    );
    startTransition(() => toggleCandidateAction(matchId, profId));
  };

  return (
    <>
      <AdminPageHeader
        title="Matches"
        subtitle="Cola de solicitudes. Los candidatos vienen rankeados por reglas; Sinnergia confirma."
      />

      <div className="space-y-4">
        {list.length === 0 && (
          <Card className="p-6 text-sm text-ink/45">Todavía no hay solicitudes de match.</Card>
        )}
        {list.map((m) => {
          const candidatos = [...m.candidatos].sort((a, b) => b.puntaje - a.puntaje);
          return (
            <Card key={m.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{m.company?.nombre}</h2>
                    <Badge variant={estadoVariant(m.estado)}>{ESTADO_MATCH_LABEL[m.estado]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink/55">{m.contexto}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActBtn onClick={() => setEstado(m.id, "en_gestion")}>En gestión</ActBtn>
                  <ActBtn onClick={() => setEstado(m.id, "cerrado")} primary>Confirmar match</ActBtn>
                  <ActBtn onClick={() => setEstado(m.id, "descartado")} subtle>Descartar</ActBtn>
                </div>
              </div>

              <div className="mt-6 space-y-2 border-t border-ink/10 pt-5">
                <div className="mb-2 text-xs uppercase tracking-[0.08em] text-ink/40">Candidatos sugeridos</div>
                {candidatos.map((c) => (
                  <div
                    key={c.professionalId}
                    className={`flex items-center gap-4 border px-4 py-3 transition-colors ${
                      c.seleccionado ? "border-ink bg-smoke" : "border-ink/10"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{c.professional?.nombre ?? "—"}</div>
                      <div className="truncate text-xs text-ink/50">
                        {c.professional?.titular} · {c.professional?.modalidad} · {c.professional?.honorarios}
                      </div>
                    </div>
                    <div className="hidden w-40 items-center gap-3 sm:flex">
                      <div className="h-1.5 flex-1 bg-ash">
                        <div className="h-full bg-ink" style={{ width: `${c.puntaje}%` }} />
                      </div>
                      <span className="w-9 text-right text-sm font-medium">{c.puntaje}</span>
                    </div>
                    <button
                      onClick={() => toggleCandidate(m.id, c.professionalId)}
                      className={`shrink-0 border px-3 py-1.5 text-xs font-medium transition-colors ${
                        c.seleccionado
                          ? "border-ink bg-ink text-paper"
                          : "border-ink/25 text-ink/70 hover:border-ink hover:text-ink"
                      }`}
                    >
                      {c.seleccionado ? "✓ Elegido" : "Elegir"}
                    </button>
                  </div>
                ))}
              </div>

              {m.resultado && <p className="mt-4 text-sm text-ink/50">Resultado: {m.resultado}</p>}
            </Card>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-ink/40">
        El puntaje simula el motor de reglas. En Fase 3 se calcula automáticamente
        cruzando rubro, presupuesto, rol, experiencia y modalidad.
      </p>
    </>
  );
}

function ActBtn({
  children,
  onClick,
  primary,
  subtle,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  subtle?: boolean;
}) {
  const cls = primary
    ? "border-ink bg-ink text-paper hover:bg-ink/85"
    : subtle
      ? "border-ink/15 text-ink/50 hover:border-ink/40 hover:text-ink"
      : "border-ink text-ink hover:bg-ink hover:text-paper";
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}
