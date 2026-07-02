"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import * as data from "@/lib/data";
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
  await data.setProfessionalEstado(id, estado);
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
  revalidatePath("/admin/empresas");
  return { ok: true };
}
