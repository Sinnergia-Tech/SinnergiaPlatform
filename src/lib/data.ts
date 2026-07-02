import { prisma } from "@/lib/prisma";
import type {
  EstadoLead,
  EstadoMatch,
  EstadoProfesional,
} from "@/lib/types";

/**
 * Capa de acceso a datos (server-only). Reemplaza a mock-data.
 * Las mutaciones se exponen vía server actions en src/lib/actions.ts.
 */

// --- Profesionales -----------------------------------------------------------

export function listProfessionals() {
  return prisma.professional.findMany({ orderBy: { createdAt: "desc" } });
}

export function getProfessional(id: string) {
  return prisma.professional.findUnique({ where: { id } });
}

/** Perfiles aprobados (visibles en el directorio público). */
export function listApprovedProfessionals() {
  return prisma.professional.findMany({
    where: { estado: "aprobado" },
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
  });
}

export function getApprovedProfessional(id: string) {
  return prisma.professional.findFirst({ where: { id, estado: "aprobado" } });
}

/** Crea una solicitud de match con sus candidatos ya rankeados. */
export function createMatchRequest(input: {
  companyId: string;
  contexto: string;
  candidatos: { professionalId: string; puntaje: number; seleccionado: boolean }[];
}) {
  return prisma.matchRequest.create({
    data: {
      companyId: input.companyId,
      contexto: input.contexto,
      estado: "solicitado",
      candidatos: {
        create: input.candidatos.map((c) => ({
          professionalId: c.professionalId,
          puntaje: c.puntaje,
          seleccionado: c.seleccionado,
        })),
      },
    },
  });
}

export function setProfessionalEstado(id: string, estado: EstadoProfesional) {
  return prisma.professional.update({ where: { id }, data: { estado } });
}

export function setProfessionalDestacado(id: string, destacado: boolean) {
  return prisma.professional.update({ where: { id }, data: { destacado } });
}

export function updateProfessional(
  id: string,
  data: Record<string, unknown>
) {
  return prisma.professional.update({ where: { id }, data });
}

export function createProfessional(data: {
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
  return prisma.professional.create({
    data: { ...data, estado: "pendiente", destacado: false },
  });
}

// --- Empresas y diagnósticos -------------------------------------------------

export function listCompaniesWithDiagnosis() {
  return prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { diagnoses: { orderBy: { createdAt: "desc" } } },
  });
}

export function getCompanyWithDiagnosis(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: { diagnoses: { orderBy: { createdAt: "desc" } } },
  });
}

export function updateLead(
  diagnosisId: string,
  data: { estadoLead?: EstadoLead; notas?: string }
) {
  return prisma.diagnosis.update({ where: { id: diagnosisId }, data });
}

export async function createCompanyWithDiagnosis(input: {
  // empresa
  nombre: string;
  contacto: string;
  email: string;
  telefono?: string;
  rubro: string;
  tamano?: string;
  sitioWeb?: string;
  // diagnóstico
  facturacion?: string;
  objetivos: string;
  presupuesto: string;
  equipoActual?: string;
  problemaPrincipal: string;
}) {
  return prisma.company.create({
    data: {
      nombre: input.nombre,
      contacto: input.contacto,
      email: input.email,
      telefono: input.telefono,
      rubro: input.rubro,
      tamano: input.tamano,
      sitioWeb: input.sitioWeb,
      origen: "web",
      diagnoses: {
        create: {
          rubro: input.rubro,
          facturacion: input.facturacion,
          objetivos: input.objetivos,
          presupuesto: input.presupuesto,
          equipoActual: input.equipoActual,
          problemaPrincipal: input.problemaPrincipal,
          estadoLead: "nuevo",
        },
      },
    },
  });
}

// --- Matches -----------------------------------------------------------------

export function listMatches() {
  return prisma.matchRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      company: true,
      candidatos: { include: { professional: true } },
    },
  });
}

export function setMatchEstado(id: string, estado: EstadoMatch) {
  return prisma.matchRequest.update({ where: { id }, data: { estado } });
}

export async function toggleCandidate(matchId: string, professionalId: string) {
  const cand = await prisma.matchCandidate.findUnique({
    where: {
      matchRequestId_professionalId: { matchRequestId: matchId, professionalId },
    },
  });
  if (!cand) return null;
  return prisma.matchCandidate.update({
    where: { id: cand.id },
    data: { seleccionado: !cand.seleccionado },
  });
}

// --- Cuenta (freelancer / empresa) ------------------------------------------

export async function getFreelancerData(professionalId: string) {
  const [professional, oportunidades] = await Promise.all([
    prisma.professional.findUnique({ where: { id: professionalId } }),
    prisma.matchCandidate.findMany({
      where: { professionalId },
      include: { matchRequest: { include: { company: true } } },
    }),
  ]);
  return { professional, oportunidades };
}

export function getEmpresaData(companyId: string) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      diagnoses: { orderBy: { createdAt: "desc" } },
      matches: { include: { candidatos: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

// --- Dashboard ---------------------------------------------------------------

export async function getDashboardData() {
  const [professionals, diagnoses, matches] = await Promise.all([
    prisma.professional.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.diagnosis.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: true },
    }),
    prisma.matchRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: true, candidatos: true },
    }),
  ]);

  const stats = {
    profesionalesTotal: professionals.length,
    profesionalesPendientes: professionals.filter((p) => p.estado === "pendiente").length,
    profesionalesAprobados: professionals.filter((p) => p.estado === "aprobado").length,
    diagnosticosTotal: diagnoses.length,
    diagnosticosNuevos: diagnoses.filter((d) => d.estadoLead === "nuevo").length,
    matchesTotal: matches.length,
    matchesEnGestion: matches.filter(
      (m) => m.estado === "en_gestion" || m.estado === "solicitado"
    ).length,
    matchesCerrados: matches.filter((m) => m.estado === "cerrado").length,
  };

  return {
    stats,
    pendientes: professionals.filter((p) => p.estado === "pendiente"),
    ultimosDiagnosticos: diagnoses.slice(0, 4),
    colaMatches: matches.filter(
      (m) => m.estado === "solicitado" || m.estado === "en_gestion"
    ),
  };
}
