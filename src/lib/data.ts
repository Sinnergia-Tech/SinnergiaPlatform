import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import type {
  EstadoLead,
  EstadoMatch,
  EstadoProfesional,
  EstadoReporte,
} from "@/lib/types";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Registra un login con Google sobre una cuenta EXISTENTE (match por email):
 * vincula el googleId/foto si faltaban, marca el email como verificado (Google ya
 * lo verificó) y refresca la ventana de actividad. Devuelve el usuario actualizado.
 */
export function linkGoogleAccount(input: {
  userId: string;
  googleId?: string | null; // se setea sólo si viene (no pisar uno existente)
  image?: string | null;
  markVerified?: boolean; // true → marca emailVerified = ahora
}) {
  return prisma.user.update({
    where: { id: input.userId },
    data: {
      lastLoginAt: new Date(),
      inactivityWarnedAt: null,
      ...(input.googleId ? { googleId: input.googleId } : {}),
      ...(input.image ? { image: input.image } : {}),
      ...(input.markVerified ? { emailVerified: new Date() } : {}),
    },
  });
}

// --- Cuentas (gestión de admin) ----------------------------------------------

const ACCOUNT_SELECT = {
  id: true,
  nombre: true,
  email: true,
  emailVerified: true,
  disabledAt: true,
  deletedAt: true,
  lastLoginAt: true,
  role: true,
  professionalId: true,
  companyId: true,
} as const;

export function getUserAccount(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: ACCOUNT_SELECT });
}

/** Todas las cuentas de usuarios (freelancers + empresas) para la vista unificada. */
export function listAccounts() {
  return prisma.user.findMany({
    where: { role: { not: "admin" } },
    orderBy: { createdAt: "desc" },
    select: ACCOUNT_SELECT,
  });
}

export function getAccountByProfessionalId(professionalId: string) {
  return prisma.user.findFirst({ where: { professionalId }, select: ACCOUNT_SELECT });
}

export function getAccountByCompanyId(companyId: string) {
  return prisma.user.findFirst({ where: { companyId }, select: ACCOUNT_SELECT });
}

/** Emails de todos los admins activos (para notificaciones internas del equipo). */
export async function listAdminEmails() {
  const admins = await prisma.user.findMany({
    where: { role: "admin", deletedAt: null },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

/** Diagnósticos sin atender (estadoLead "nuevo") — empresas esperando contacto. */
export function countNewDiagnoses() {
  return prisma.diagnosis.count({ where: { estadoLead: "nuevo" } });
}

// --- Ciclo de vida de cuenta ------------------------------------------------

/** Una cuenta se considera inactiva si no loguea hace más de 30 días. */
export const INACTIVITY_DAYS = 30;
/** Se avisa por email a los 25 días (antes de quedar oculto a los 30). */
export const INACTIVITY_WARN_DAYS = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

/**
 * Filtro Prisma para "el usuario detrás de este perfil está activo": no
 * eliminado, no deshabilitado manualmente y con login reciente. Los perfiles
 * sin cuenta (user null) se consideran visibles (los crea el admin/seed).
 */
function visibleByUserFilter() {
  return {
    OR: [
      { user: null },
      {
        user: {
          deletedAt: null,
          disabledAt: null,
          lastLoginAt: { gte: daysAgo(INACTIVITY_DAYS) },
        },
      },
    ],
  };
}

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

/** Perfiles aprobados y con cuenta activa (visibles en el directorio público). */
export function listApprovedProfessionals() {
  return prisma.professional.findMany({
    where: { estado: "aprobado", ...visibleByUserFilter() },
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
  });
}

export function getApprovedProfessional(id: string) {
  return prisma.professional.findFirst({
    where: { id, estado: "aprobado", ...visibleByUserFilter() },
    include: { portfolio: { orderBy: { orden: "asc" } } },
  });
}

/** Perfil con portfolio SIN filtro de estado — para la vista previa del dueño. */
export function getProfessionalWithPortfolio(id: string) {
  return prisma.professional.findUnique({
    where: { id },
    include: { portfolio: { orderBy: { orden: "asc" } } },
  });
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

export async function setProfessionalEstado(id: string, estado: EstadoProfesional) {
  // Al aprobar por PRIMERA vez, sellamos `aprobadoAt` (para medir el tiempo de
  // moderación). No lo pisamos si ya estaba seteado (una re-aprobación no cuenta).
  let sellarAprobado = false;
  if (estado === "aprobado") {
    const current = await prisma.professional.findUnique({
      where: { id },
      select: { aprobadoAt: true },
    });
    sellarAprobado = !current?.aprobadoAt;
  }
  return prisma.professional.update({
    where: { id },
    data: sellarAprobado ? { estado, aprobadoAt: new Date() } : { estado },
  });
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

/** Crea el Professional (lead) y su User (cuenta) en una sola transacción. */
export function createProfessionalWithAccount(input: {
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
  // Cuenta por contraseña → passwordHash. Cuenta por Google → googleId/image/
  // emailVerified (sin passwordHash). Se separan del resto para no meterlos en
  // el `Professional`.
  passwordHash?: string | null;
  googleId?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
}) {
  const { passwordHash, googleId, image, emailVerified, ...professionalData } = input;
  return prisma.$transaction(async (tx) => {
    const professional = await tx.professional.create({
      data: { ...professionalData, estado: "pendiente", destacado: false },
    });
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: passwordHash ?? null,
        nombre: input.nombre,
        role: "freelancer",
        professionalId: professional.id,
        googleId: googleId ?? null,
        image: image ?? null,
        emailVerified: emailVerified ?? null,
      },
    });
    return { professional, user };
  });
}

// --- Empresas y diagnósticos -------------------------------------------------

/** Lista mínima de empresas (para selectores). */
export function listCompaniesBasic() {
  return prisma.company.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
}

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

/** Agrega un Diagnosis a una Company que ya tiene cuenta (no crea User de nuevo). */
export function createDiagnosisForCompany(
  companyId: string,
  input: {
    rubro: string;
    facturacion?: string;
    objetivos: string;
    presupuesto: string;
    equipoActual?: string;
    problemaPrincipal: string;
  }
) {
  return prisma.diagnosis.create({
    data: {
      companyId,
      rubro: input.rubro,
      facturacion: input.facturacion,
      objetivos: input.objetivos,
      presupuesto: input.presupuesto,
      equipoActual: input.equipoActual,
      problemaPrincipal: input.problemaPrincipal,
      estadoLead: "nuevo",
    },
  });
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

/** Crea sólo la Company + User (cuenta), sin Diagnosis — alta mínima de cuenta. */
export function createCompanyAccount(input: {
  nombre: string;
  contacto: string;
  email: string;
  rubro: string;
  passwordHash?: string | null;
  googleId?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
}) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        nombre: input.nombre,
        contacto: input.contacto,
        email: input.email,
        rubro: input.rubro,
        origen: "web",
      },
    });
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash ?? null,
        nombre: input.contacto,
        role: "empresa",
        companyId: company.id,
        googleId: input.googleId ?? null,
        image: input.image ?? null,
        emailVerified: input.emailVerified ?? null,
      },
    });
    return { company, user };
  });
}

/** Crea la Company + Diagnosis y su User (cuenta) en una sola transacción. */
export function createCompanyWithAccount(input: {
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
  passwordHash: string;
}) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
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
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        nombre: input.contacto,
        role: "empresa",
        companyId: company.id,
      },
    });
    return { company, user };
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
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: { portfolio: { orderBy: { orden: "asc" } } },
  });
  return { professional };
}

/** Matches donde Sinnergia propuso a este freelancer como candidato. */
export function listMatchOpportunities(professionalId: string) {
  return prisma.matchCandidate.findMany({
    where: { professionalId },
    include: { matchRequest: { include: { company: true } } },
    orderBy: { matchRequest: { createdAt: "desc" } },
  });
}

// --- Portfolio (freelancer) --------------------------------------------------

export function createPortfolioItem(input: {
  professionalId: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  enlace?: string;
}) {
  return prisma.portfolioItem.create({ data: input });
}

export function countPortfolioItems(professionalId: string) {
  return prisma.portfolioItem.count({ where: { professionalId } });
}

/** Borra un proyecto de portfolio (moderación de admin). Devuelve el professionalId. */
export async function adminDeletePortfolioItem(id: string) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id },
    select: { professionalId: true },
  });
  if (!item) return null;
  await prisma.portfolioItem.delete({ where: { id } });
  return item.professionalId;
}

/** Quita una imagen de la galería del portfolio (moderación de admin). */
export async function adminRemovePortfolioImage(professionalId: string, url: string) {
  const prof = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { portfolioImagenes: true },
  });
  if (!prof) return;
  await prisma.professional.update({
    where: { id: professionalId },
    data: { portfolioImagenes: prof.portfolioImagenes.filter((u) => u !== url) },
  });
}

/** Actualiza un ítem sólo si pertenece al profesional dueño de la sesión. */
export async function updatePortfolioItem(
  id: string,
  professionalId: string,
  input: {
    titulo: string;
    descripcion: string;
    imagenUrl: string | null;
    enlace: string | null;
  },
) {
  const { count } = await prisma.portfolioItem.updateMany({
    where: { id, professionalId },
    data: input,
  });
  return count > 0;
}

/** Borra un ítem sólo si pertenece al profesional dueño de la sesión. */
export async function deletePortfolioItem(id: string, professionalId: string) {
  const { count } = await prisma.portfolioItem.deleteMany({
    where: { id, professionalId },
  });
  return count > 0;
}

// --- Google Calendar (conexión del estudio, singleton) -----------------------

export function getCalendarConnection() {
  return prisma.googleCalendarConnection.findFirst();
}

/** Guarda (reemplazando) la conexión del estudio. refreshToken ya viene cifrado. */
export async function saveCalendarConnection(input: {
  email: string;
  refreshToken: string;
  connectedById?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.googleCalendarConnection.deleteMany({});
    return tx.googleCalendarConnection.create({
      data: {
        email: input.email,
        refreshToken: input.refreshToken,
        connectedById: input.connectedById ?? null,
      },
    });
  });
}

export function deleteCalendarConnection() {
  return prisma.googleCalendarConnection.deleteMany({});
}

// --- Sesiones agendadas (Meetings) -------------------------------------------

export function createMeeting(input: {
  companyId: string;
  diagnosisId?: string | null;
  scheduledById?: string | null;
  titulo: string;
  startsAt: Date;
  endsAt: Date;
  googleEventId?: string | null;
  meetUrl?: string | null;
  htmlLink?: string | null;
}) {
  return prisma.meeting.create({ data: input });
}

/** Todas las sesiones (para la grilla del calendario), con el nombre de la empresa. */
export function listMeetings() {
  return prisma.meeting.findMany({
    orderBy: { startsAt: "asc" },
    include: { company: { select: { id: true, nombre: true, email: true } } },
  });
}

export function listMeetingsForCompany(companyId: string) {
  return prisma.meeting.findMany({
    where: { companyId },
    orderBy: { startsAt: "asc" },
  });
}

export function getMeeting(id: string) {
  return prisma.meeting.findUnique({ where: { id } });
}

export function markMeetingCancelled(id: string) {
  return prisma.meeting.update({ where: { id }, data: { estado: "cancelada" } });
}

// --- Devoluciones / Feedback -------------------------------------------------

export function createFeedback(input: {
  companyId: string;
  diagnosisId?: string | null;
  createdById?: string | null;
  title: string;
  descriptionMd: string;
  score?: number | null;
  fortalezasMd?: string | null;
  mejorasMd?: string | null;
  categoria?: string | null;
}) {
  return prisma.feedback.create({ data: input });
}

export function updateFeedback(
  id: string,
  fields: {
    title?: string;
    descriptionMd?: string;
    score?: number | null;
    fortalezasMd?: string | null;
    mejorasMd?: string | null;
    categoria?: string | null;
  }
) {
  return prisma.feedback.update({ where: { id }, data: fields });
}

export function getFeedback(id: string) {
  return prisma.feedback.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      company: { select: { id: true, nombre: true, email: true } },
    },
  });
}

/** Todas las devoluciones de una empresa (vista admin). */
export function listFeedbacksForCompany(companyId: string) {
  return prisma.feedback.findMany({
    where: { companyId },
    orderBy: [{ createdAt: "desc" }],
    include: { _count: { select: { attachments: true } } },
  });
}

/** Solo las publicadas (vista de la empresa). */
export function listPublishedFeedbacksForCompany(companyId: string) {
  return prisma.feedback.findMany({
    where: { companyId, status: "published" },
    orderBy: [{ publishedAt: "desc" }],
    include: { _count: { select: { attachments: true } } },
  });
}

export function countUnreadFeedbacksForCompany(companyId: string) {
  return prisma.feedback.count({
    where: { companyId, status: "published", readAt: null },
  });
}

export function publishFeedback(id: string) {
  return prisma.feedback.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });
}

export function deleteFeedback(id: string) {
  return prisma.feedback.delete({ where: { id } });
}

export async function markFeedbackRead(id: string) {
  const fb = await prisma.feedback.findUnique({ where: { id }, select: { readAt: true } });
  if (fb && !fb.readAt) {
    await prisma.feedback.update({ where: { id }, data: { readAt: new Date() } });
  }
}

export function addFeedbackAttachment(input: {
  feedbackId: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
}) {
  return prisma.feedbackAttachment.create({ data: input });
}

export function getFeedbackAttachment(id: string) {
  return prisma.feedbackAttachment.findUnique({
    where: { id },
    include: { feedback: { select: { companyId: true, status: true } } },
  });
}

export async function deleteFeedbackAttachment(id: string) {
  const att = await prisma.feedbackAttachment.findUnique({
    where: { id },
    select: { id: true, url: true, feedbackId: true },
  });
  if (!att) return null;
  await prisma.feedbackAttachment.delete({ where: { id } });
  return att;
}

// --- Reportes de contenido ---------------------------------------------------

export function createReport(input: {
  professionalId: string;
  motivo: string;
  detalle?: string | null;
  reporterUserId?: string | null;
  reporterIp?: string | null;
}) {
  return prisma.report.create({ data: input });
}

/** ¿El mismo usuario ya tiene un reporte pendiente sobre este perfil? (anti-spam) */
export async function hasPendingReportFrom(professionalId: string, reporterUserId: string) {
  const existing = await prisma.report.findFirst({
    where: { professionalId, reporterUserId, estado: "pendiente" },
    select: { id: true },
  });
  return existing !== null;
}

export function countPendingReports() {
  return prisma.report.count({ where: { estado: "pendiente" } });
}

export function listReports() {
  return prisma.report.findMany({
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    include: {
      professional: {
        select: {
          id: true,
          nombre: true,
          titular: true,
          estado: true,
          user: { select: { id: true, disabledAt: true, deletedAt: true } },
        },
      },
    },
  });
}

export function getReport(id: string) {
  return prisma.report.findUnique({
    where: { id },
    select: { id: true, professionalId: true },
  });
}

export function setReportEstado(id: string, estado: EstadoReporte) {
  return prisma.report.update({ where: { id }, data: { estado } });
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

/** Perfil de empresa (visible al freelancer en el futuro, no todavía). */
export function updateCompanyProfile(
  companyId: string,
  fields: {
    descripcion?: string;
    logoUrl?: string;
    linkedin?: string;
    instagram?: string;
    ubicacion?: string;
  }
) {
  return prisma.company.update({ where: { id: companyId }, data: fields });
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

/**
 * Datos para la sección de analíticas del dashboard. Una sola pasada por las
 * tablas principales; los desgloses se calculan en memoria (volumen chico).
 *
 * Los administradores son staff: NO se cuentan como "usuarios" de la plataforma
 * en ninguna métrica de usuarios (composición, altas, actividad, ciclo de vida,
 * registros por mes).
 */
// Ventana móvil del gráfico de registros por mes. Se recalcula en cada carga
// (la página es dynamic), así que avanza sola mes a mes: cada mes entra una barra
// nueva y sale la más vieja. 12 = rendimiento del último año.
const MONTHS_WINDOW = 12;

export async function getAnalyticsData() {
  const d30 = daysAgo(INACTIVITY_DAYS);
  const d7 = daysAgo(7);

  const [users, professionals, companiesTotal, diagnoses, matches, contacts, reportsPendientes] =
    await Promise.all([
      prisma.user.findMany({
        select: {
          role: true,
          createdAt: true,
          lastLoginAt: true,
          emailVerified: true,
          disabledAt: true,
          deletedAt: true,
        },
      }),
      prisma.professional.findMany({
        select: { estado: true, destacado: true, createdAt: true, aprobadoAt: true },
      }),
      prisma.company.count(),
      prisma.diagnosis.findMany({
        select: { estadoLead: true, createdAt: true, company: { select: { rubro: true } } },
      }),
      prisma.matchRequest.findMany({
        select: {
          estado: true,
          createdAt: true,
          candidatos: { select: { professional: { select: { roles: true } } } },
        },
      }),
      prisma.contact.findMany({ select: { status: true, createdAt: true, readAt: true } }),
      prisma.report.count({ where: { estado: "pendiente" } }),
    ]);

  const sesionesAgendadas = await prisma.meeting.count({
    where: { estado: { not: "cancelada" } },
  });

  // Tamaño de la base (total + por tabla): queries crudas separadas — si el rol no
  // tiene permiso o falla, no queremos que se caiga el dashboard. Default a vacío.
  let dbBytes = 0;
  let dbTables: { tabla: string; bytes: number }[] = [];
  try {
    const rows = await prisma.$queryRaw<
      Array<{ bytes: bigint }>
    >`SELECT pg_database_size(current_database()) AS bytes`;
    dbBytes = Number(rows[0]?.bytes ?? 0);
  } catch {
    dbBytes = 0;
  }
  try {
    const rows = await prisma.$queryRaw<Array<{ tabla: string; bytes: bigint }>>`
      SELECT c.relname AS tabla, pg_total_relation_size(c.oid) AS bytes
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY bytes DESC
      LIMIT 6`;
    dbTables = rows.map((r) => ({ tabla: r.tabla, bytes: Number(r.bytes) }));
  } catch {
    dbTables = [];
  }

  // Usuarios de la plataforma = freelancers + empresas (los admins son staff).
  const platformAll = users.filter((u) => u.role !== "admin"); // incluye eliminados
  const platform = platformAll.filter((u) => !u.deletedAt);

  // Usuarios por rol.
  const usersByRole = {
    freelancer: platform.filter((u) => u.role === "freelancer").length,
    empresa: platform.filter((u) => u.role === "empresa").length,
  };

  // Ciclo de vida de las cuentas (ejes independientes → buckets excluyentes).
  const lifecycle = {
    activas: platform.filter((u) => !u.disabledAt && u.lastLoginAt >= d30).length,
    inactivas: platform.filter((u) => !u.disabledAt && u.lastLoginAt < d30).length,
    deshabilitadas: platform.filter((u) => u.disabledAt).length,
    eliminadas: platformAll.filter((u) => u.deletedAt).length,
  };

  // Actividad reciente.
  const activity = {
    usuariosTotal: platform.length,
    verificados: platform.filter((u) => u.emailVerified).length,
    nuevos30d: platformAll.filter((u) => u.createdAt >= d30).length,
    activos7d: platform.filter((u) => !u.disabledAt && u.lastLoginAt >= d7).length,
    activos30d: platform.filter((u) => !u.disabledAt && u.lastLoginAt >= d30).length,
    diagnosticos30d: diagnoses.filter((d) => d.createdAt >= d30).length,
    matches30d: matches.filter((m) => m.createdAt >= d30).length,
    contactos30d: contacts.filter((c) => c.createdAt >= d30).length,
  };

  // Moderación de perfiles + tiempo promedio de aprobación.
  const aprobados = professionals.filter((p) => p.aprobadoAt);
  const diasAprobacion = aprobados.map(
    (p) => (p.aprobadoAt!.getTime() - p.createdAt.getTime()) / DAY_MS
  );
  const moderacion = {
    pendiente: professionals.filter((p) => p.estado === "pendiente").length,
    aprobado: professionals.filter((p) => p.estado === "aprobado").length,
    rechazado: professionals.filter((p) => p.estado === "rechazado").length,
    oculto: professionals.filter((p) => p.estado === "oculto").length,
    destacados: professionals.filter((p) => p.destacado).length,
    total: professionals.length,
    // Promedio de días entre alta y primera aprobación (null si no hay datos aún).
    avgAprobacionDias:
      diasAprobacion.length > 0
        ? diasAprobacion.reduce((a, d) => a + d, 0) / diasAprobacion.length
        : null,
    medidos: diasAprobacion.length,
  };

  // Demanda: rubros de las empresas que pidieron diagnóstico + roles que el motor
  // de match propone como candidatos. Top 5 de cada uno.
  const topN = (counts: Map<string, number>, n = 5) =>
    [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, n);

  const rubroCounts = new Map<string, number>();
  for (const d of diagnoses) {
    const r = d.company?.rubro;
    if (r) rubroCounts.set(r, (rubroCounts.get(r) ?? 0) + 1);
  }
  const roleCounts = new Map<string, number>();
  for (const m of matches) {
    for (const c of m.candidatos) {
      for (const role of c.professional.roles) {
        roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      }
    }
  }
  const demanda = {
    rubros: topN(rubroCounts),
    roles: topN(roleCounts),
  };

  // Actividad de empresas (embudo + contactos).
  const empresas = {
    total: companiesTotal,
    diagnosticos: diagnoses.length,
    sesiones: sesionesAgendadas,
    matchesTotal: matches.length,
    matchesPorEstado: {
      solicitado: matches.filter((m) => m.estado === "solicitado").length,
      en_gestion: matches.filter((m) => m.estado === "en_gestion").length,
      cerrado: matches.filter((m) => m.estado === "cerrado").length,
      descartado: matches.filter((m) => m.estado === "descartado").length,
    },
    contactosTotal: contacts.length,
    contactosRespondidos: contacts.filter(
      (c) => c.status === "accepted" || c.status === "rejected"
    ).length,
  };

  // Registros por mes: ventana móvil de MONTHS_WINDOW meses. Los buckets se arman
  // desde "ahora" hacia atrás con clave año-mes (robusta ante cambios de año), así
  // que el gráfico avanza solo. Cada barra incluye el año para desambiguar el
  // límite entre años. Sólo usuarios de plataforma (no admins).
  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const monthly: { label: string; year: number; freelancer: number; empresa: number; total: number }[] = [];
  const keyToIndex = new Map<string, number>();
  for (let i = MONTHS_WINDOW - 1; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keyToIndex.set(monthKey(m), monthly.length);
    monthly.push({
      label: m.toLocaleDateString("es-AR", { month: "short" }),
      year: m.getFullYear(),
      freelancer: 0,
      empresa: 0,
      total: 0,
    });
  }
  for (const u of platformAll) {
    const idx = keyToIndex.get(monthKey(new Date(u.createdAt)));
    if (idx === undefined) continue;
    monthly[idx].total++;
    if (u.role === "freelancer") monthly[idx].freelancer++;
    else if (u.role === "empresa") monthly[idx].empresa++;
  }

  // Umbral de alerta de tamaño de la base, configurable por env (en MB). Sin
  // valor → sin alerta (no atamos la UI a ningún plan puntual de Supabase).
  const alertRaw = Number(process.env.DB_SIZE_ALERT_MB);
  const alertMb = Number.isFinite(alertRaw) && alertRaw > 0 ? alertRaw : null;

  return {
    usersByRole,
    lifecycle,
    activity,
    moderacion,
    empresas,
    demanda,
    monthly,
    reportsPendientes,
    db: { bytes: dbBytes, tablas: dbTables, alertMb },
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;

// --- Verificación de email ----------------------------------------------------

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/** Crea un token de verificación y descarta los pendientes previos del usuario. */
export async function createEmailVerificationToken(userId: string) {
  const { raw, hash } = generateToken();
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { userId, usedAt: null },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    }),
  ]);
  return raw;
}

/** Valida un token de verificación y, si es válido, marca el email como verificado. */
export async function consumeEmailVerificationToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return { ok: false as const };
  }
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: token.userId, usedAt: null },
    }),
    prisma.user.update({
      where: { id: token.userId },
      data: { emailVerified: new Date() },
    }),
  ]);
  return { ok: true as const, user: token.user };
}

// --- Recuperación de contraseña -----------------------------------------------

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** Crea un token de reset y descarta los pendientes previos del usuario. */
export async function createPasswordResetToken(userId: string) {
  const { raw, hash } = generateToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    }),
  ]);
  return raw;
}

/** Valida un token de reset y, si es válido, actualiza la contraseña (uso único). */
export async function consumePasswordResetToken(
  rawToken: string,
  newPasswordHash: string
) {
  const tokenHash = hashToken(rawToken);
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return { ok: false as const };
  }
  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: token.userId, usedAt: null },
    }),
    prisma.user.update({
      where: { id: token.userId },
      data: {
        passwordHash: newPasswordHash,
        // El link llegó por email: probar que lo controlás también lo verifica.
        emailVerified: token.user.emailVerified ?? new Date(),
      },
    }),
  ]);
  return { ok: true as const, user: token.user };
}

// --- Contacto empresa → freelancer -------------------------------------------

const ACTIVE_CONTACT_STATUSES = ["pending", "accepted"] as const;

/** Contacto activo (pending/accepted) entre esa empresa y ese freelancer, si existe. */
export function findActiveContact(companyId: string, professionalId: string) {
  return prisma.contact.findFirst({
    where: {
      companyId,
      professionalId,
      status: { in: [...ACTIVE_CONTACT_STATUSES] },
    },
  });
}

export function createContact(companyId: string, professionalId: string) {
  return prisma.contact.create({
    data: { companyId, professionalId, lastNotificationSentAt: new Date() },
  });
}

/** Todos los contactos empresa→freelancer (supervisión de admin). */
export function listContacts() {
  return prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { id: true, nombre: true } },
      professional: { select: { id: true, nombre: true } },
    },
  });
}

export function listContactsForCompany(companyId: string) {
  return prisma.contact.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { professional: true },
  });
}

export function listContactsForFreelancer(professionalId: string) {
  return prisma.contact.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
    include: { company: true },
  });
}

/** El `where` incluye el dueño: nunca devuelve un contacto de otro freelancer. */
export function getContactForFreelancer(id: string, professionalId: string) {
  return prisma.contact.findFirst({
    where: { id, professionalId },
    include: { company: true },
  });
}

export async function markContactRead(id: string, professionalId: string) {
  const { count } = await prisma.contact.updateMany({
    where: { id, professionalId, readAt: null },
    data: { readAt: new Date() },
  });
  return count > 0;
}

export function countUnreadContacts(professionalId: string) {
  return prisma.contact.count({ where: { professionalId, readAt: null } });
}

// --- Estado de cuenta (deshabilitar / reactivar / eliminar) -----------------

/** Flags de estado para el enforcement (punto ciego de sesiones JWT). */
export function getAccountFlags(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { disabledAt: true, disabledByAdmin: true, deletedAt: true },
  });
}

/** Deshabilitación manual: el usuario se oculta a propósito. */
export function disableUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { disabledAt: new Date(), disabledByAdmin: false },
  });
}

/** Reactivación explícita: limpia la baja manual y cuenta como actividad. */
export function reactivateUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { disabledAt: null, disabledByAdmin: false, lastLoginAt: new Date(), inactivityWarnedAt: null },
  });
}

/** Suspensión por el admin: el usuario NO puede reactivarse solo. */
export function adminDisableUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { disabledAt: new Date(), disabledByAdmin: true },
  });
}

/** El admin levanta la suspensión. */
export function adminReactivateUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { disabledAt: null, disabledByAdmin: false, lastLoginAt: new Date(), inactivityWarnedAt: null },
  });
}

/**
 * Soft-delete + anonimización. Marca la cuenta como eliminada, libera el email
 * (para re-registro) y borra los datos personales del User y de su
 * Professional/Company. Conserva el esqueleto relacional (matches, leads,
 * contactos) para no romper el historial de negocio.
 */
export async function softDeleteUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, professionalId: true, companyId: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return;

  const placeholder = `deleted+${userId}@deleted.invalid`;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        disabledAt: new Date(),
        email: placeholder,
        nombre: "Cuenta eliminada",
      },
    });

    if (user.professionalId) {
      await tx.professional.update({
        where: { id: user.professionalId },
        data: {
          nombre: "Cuenta eliminada",
          email: placeholder,
          whatsapp: null,
          linkedin: null,
          instagram: null,
          portfolioUrl: null,
          fotoUrl: null,
          ubicacion: null,
          descripcion: "",
          estado: "oculto",
          destacado: false,
        },
      });
    }

    if (user.companyId) {
      await tx.company.update({
        where: { id: user.companyId },
        data: {
          nombre: "Cuenta eliminada",
          contacto: "",
          email: placeholder,
          telefono: null,
          sitioWeb: null,
          descripcion: null,
          logoUrl: null,
          linkedin: null,
          instagram: null,
          ubicacion: null,
        },
      });
    }
  });
}

// --- Tareas del job diario (cron) -------------------------------------------

/**
 * Cuentas verificadas, activas y sin aviso previo que llevan ≥25 días sin
 * loguear. Se les manda el nudge de inactividad (y luego se marcan como avisadas).
 */
export function findUsersToWarnForInactivity() {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      disabledAt: null,
      emailVerified: { not: null },
      inactivityWarnedAt: null,
      lastLoginAt: { lte: daysAgo(INACTIVITY_WARN_DAYS) },
    },
    select: { id: true, email: true, nombre: true },
  });
}

export function markInactivityWarned(userIds: string[]) {
  return prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { inactivityWarnedAt: new Date() },
  });
}

/** Limpieza de tokens vencidos/usados y hits de rate-limit viejos. */
export async function purgeExpiredAuthArtifacts() {
  const now = new Date();
  const [verif, reset, rate] = await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
    }),
    // Las ventanas de rate-limit son ≤1h; 24h de retención es de sobra.
    prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: daysAgo(1) } } }),
  ]);
  return { verificationTokens: verif.count, resetTokens: reset.count, rateLimitHits: rate.count };
}

/**
 * Solicitudes de contacto pendientes, no leídas por el freelancer, cuyo último
 * aviso fue hace ≥3 días. Para recordarle que tiene una empresa esperando.
 */
export function findContactsNeedingReminder() {
  return prisma.contact.findMany({
    where: {
      status: "pending",
      readAt: null,
      lastNotificationSentAt: { lt: daysAgo(3) },
      // Solo freelancers con cuenta activa (no eliminada / deshabilitada).
      professional: { user: { deletedAt: null, disabledAt: null } },
    },
    include: { professional: true, company: true },
  });
}

export function markContactsReminded(contactIds: string[]) {
  return prisma.contact.updateMany({
    where: { id: { in: contactIds } },
    data: { lastNotificationSentAt: new Date() },
  });
}

/** Profesionales en moderación hace ≥2 días (para el digest al admin). */
export function findStalePendingProfessionals() {
  return prisma.professional.findMany({
    where: { estado: "pendiente", createdAt: { lt: daysAgo(2) } },
    orderBy: { createdAt: "asc" },
    select: { id: true, nombre: true, titular: true, createdAt: true },
  });
}
