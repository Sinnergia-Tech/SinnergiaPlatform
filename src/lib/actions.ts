"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import * as data from "@/lib/data";
import {
  notifyNewApplication,
  sendApplicationConfirmation,
  notifyNewDiagnosis,
  sendDiagnosisConfirmation,
  sendApprovalEmail,
} from "@/lib/email";
import { rankProfessionals, queryFromProfessional } from "@/lib/matching";
import type {
  EstadoLead,
  EstadoMatch,
  EstadoProfesional,
} from "@/lib/types";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("No autorizado");
  }
}

// --- Profesionales (admin) ---------------------------------------------------

export async function setProfessionalEstadoAction(
  id: string,
  estado: EstadoProfesional
) {
  await requireAdmin();
  const prof = await data.setProfessionalEstado(id, estado);
  // Al aprobar, avisamos al profesional.
  if (estado === "aprobado" && prof?.email) {
    await sendApprovalEmail({ nombre: prof.nombre, email: prof.email });
  }
  revalidatePath("/admin/profesionales");
  revalidatePath(`/admin/profesionales/${id}`);
  revalidatePath("/admin");
}

export async function setProfessionalDestacadoAction(
  id: string,
  destacado: boolean
) {
  await requireAdmin();
  await data.setProfessionalDestacado(id, destacado);
  revalidatePath(`/admin/profesionales/${id}`);
}

export async function saveProfessionalAction(
  id: string,
  fields: Record<string, unknown>
) {
  await requireAdmin();
  await data.updateProfessional(id, fields);
  revalidatePath(`/admin/profesionales/${id}`);
  revalidatePath("/admin/profesionales");
}

// --- Leads / diagnósticos (admin) --------------------------------------------

export async function updateLeadAction(
  diagnosisId: string,
  payload: { estadoLead?: EstadoLead; notas?: string }
) {
  await requireAdmin();
  await data.updateLead(diagnosisId, payload);
  revalidatePath("/admin/empresas");
}

// --- Matches (admin) ---------------------------------------------------------

export async function setMatchEstadoAction(id: string, estado: EstadoMatch) {
  await requireAdmin();
  await data.setMatchEstado(id, estado);
  revalidatePath("/admin/matches");
  revalidatePath("/admin");
}

export async function toggleCandidateAction(
  matchId: string,
  professionalId: string
) {
  await requireAdmin();
  await data.toggleCandidate(matchId, professionalId);
  revalidatePath("/admin/matches");
}

// --- Solicitud de match desde el directorio ---------------------------------

export async function solicitarMatchAction(professionalId: string) {
  const session = await auth();
  // Solo empresas logueadas pueden solicitar match; el resto va al diagnóstico.
  if (session?.user?.role !== "empresa" || !session.user.companyId) {
    return { ok: false as const, redirect: "/diagnostico" };
  }

  const prof = await data.getProfessional(professionalId);
  if (!prof) return { ok: false as const, error: "Perfil no encontrado" };

  // Rankeamos perfiles similares para armar la lista de candidatos.
  const approved = await data.listApprovedProfessionals();
  const { top } = rankProfessionals(approved, queryFromProfessional(prof), 5);

  const seen = new Set<string>();
  const candidatos: {
    professionalId: string;
    puntaje: number;
    seleccionado: boolean;
  }[] = [];
  const requestedScore =
    top.find((t) => t.professional.id === professionalId)?.score ?? 80;
  candidatos.push({ professionalId, puntaje: requestedScore, seleccionado: true });
  seen.add(professionalId);
  for (const t of top) {
    if (seen.has(t.professional.id)) continue;
    candidatos.push({
      professionalId: t.professional.id,
      puntaje: t.score,
      seleccionado: false,
    });
    seen.add(t.professional.id);
  }

  await data.createMatchRequest({
    companyId: session.user.companyId,
    contexto: `Solicitud desde el directorio · ${prof.titular}`,
    candidatos,
  });
  revalidatePath("/cuenta");
  revalidatePath("/admin/matches");
  return { ok: true as const };
}

// --- Formularios públicos (sin auth) -----------------------------------------

export async function submitApplicationAction(input: {
  nombre: string;
  email: string;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  portfolioUrl?: string;
  titular: string;
  descripcion: string;
  roles: string[];
  rubros: string[];
  experiencia: string;
  honorarios: string;
  modalidad: string;
  disponibilidad: string;
}) {
  if (!input.nombre || !input.email || !input.titular) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  await data.createProfessional(input);
  await notifyNewApplication({ nombre: input.nombre, titular: input.titular, email: input.email });
  await sendApplicationConfirmation({ nombre: input.nombre, email: input.email });
  revalidatePath("/admin/profesionales");
  return { ok: true };
}

export async function submitDiagnosisAction(input: {
  nombre: string;
  contacto: string;
  email: string;
  telefono?: string;
  rubro: string;
  tamano?: string;
  sitioWeb?: string;
  facturacion?: string;
  objetivos: string;
  presupuesto: string;
  equipoActual?: string;
  problemaPrincipal: string;
}) {
  if (!input.nombre || !input.email || !input.objetivos || !input.problemaPrincipal) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  await data.createCompanyWithDiagnosis(input);
  await notifyNewDiagnosis({ nombre: input.nombre, email: input.email, rubro: input.rubro });
  await sendDiagnosisConfirmation({ nombre: input.nombre, email: input.email });
  revalidatePath("/admin/empresas");
  return { ok: true };
}
