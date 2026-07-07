import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/tokens";
import type {
  EstadoLead,
  EstadoMatch,
  EstadoProfesional,
} from "@/lib/types";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
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
  passwordHash: string;
}) {
  const { passwordHash, ...professionalData } = input;
  return prisma.$transaction(async (tx) => {
    const professional = await tx.professional.create({
      data: { ...professionalData, estado: "pendiente", destacado: false },
    });
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        nombre: input.nombre,
        role: "freelancer",
        professionalId: professional.id,
      },
    });
    return { professional, user };
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
  passwordHash: string;
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
        passwordHash: input.passwordHash,
        nombre: input.contacto,
        role: "empresa",
        companyId: company.id,
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
  const [professional, oportunidades] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: professionalId },
      include: { portfolio: { orderBy: { orden: "asc" } } },
    }),
    prisma.matchCandidate.findMany({
      where: { professionalId },
      include: { matchRequest: { include: { company: true } } },
    }),
  ]);
  return { professional, oportunidades };
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

/** Borra un ítem sólo si pertenece al profesional dueño de la sesión. */
export async function deletePortfolioItem(id: string, professionalId: string) {
  const { count } = await prisma.portfolioItem.deleteMany({
    where: { id, professionalId },
  });
  return count > 0;
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
    select: { disabledAt: true, deletedAt: true },
  });
}

/** Deshabilitación manual: el usuario se oculta a propósito. */
export function disableUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { disabledAt: new Date() },
  });
}

/** Reactivación explícita: limpia la baja manual y cuenta como actividad. */
export function reactivateUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { disabledAt: null, lastLoginAt: new Date(), inactivityWarnedAt: null },
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
