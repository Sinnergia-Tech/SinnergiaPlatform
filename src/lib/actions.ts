"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/auth";
import * as data from "@/lib/data";
import { verifyOnboardingToken } from "@/lib/google-onboarding";
import { decryptSecret } from "@/lib/crypto";
import {
  refreshAccessToken,
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";
import {
  notifyNewApplication,
  sendApplicationConfirmation,
  notifyNewDiagnosis,
  sendDiagnosisConfirmation,
  sendApprovalEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactRequestEmail,
} from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { isPasswordValid, PASSWORD_HINT } from "@/lib/password-policy";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { uploadProfilePhoto, InvalidPhotoError } from "@/lib/storage";
import { PORTFOLIO_LIMITS } from "@/lib/portfolio-limits";
import { normalizeExternalUrl } from "@/lib/url";
import { checkBlobImage, checkText, checkUrlSafe } from "@/lib/security";
import {
  EXPERIENCIAS,
  PRESUPUESTOS,
  MODALIDADES,
  DISPONIBILIDADES,
  ROLES,
  RUBROS,
} from "@/lib/catalogs";
import type {
  EstadoLead,
  EstadoMatch,
  EstadoProfesional,
  EstadoReporte,
} from "@/lib/types";
import { REPORTE_MOTIVOS } from "@/lib/types";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

function verificationUrl(token: string) {
  return `${SITE_URL}/verificar-email?token=${token}`;
}

function resetUrl(token: string) {
  return `${SITE_URL}/restablecer-contrasena?token=${token}`;
}

function contactUrl(contactId: string) {
  return `${SITE_URL}/cuenta/contactos/${contactId}`;
}

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

/** Borra un proyecto de portfolio de cualquier profesional (moderación). */
export async function adminDeletePortfolioItemAction(
  itemId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const professionalId = await data.adminDeletePortfolioItem(itemId);
  if (!professionalId) return { ok: false, error: "No se encontró el proyecto." };
  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/red/${professionalId}`);
  return { ok: true };
}

/** Quita una imagen de la galería del portfolio de un profesional (moderación). */
export async function adminRemovePortfolioImageAction(
  professionalId: string,
  url: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  await data.adminRemovePortfolioImage(professionalId, url);
  revalidatePath(`/admin/profesionales/${professionalId}`);
  revalidatePath(`/red/${professionalId}`);
  return { ok: true };
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

// --- Gestión de cuentas (admin) ----------------------------------------------
// El admin interviene sobre las cuentas de freelancers/empresas. No opera sobre
// cuentas de admin desde acá (evita bloqueos entre admins o auto-bloqueo).

type AccountResult = { ok: boolean; error?: string };

function revalidateAccountPaths(user: {
  professionalId?: string | null;
  companyId?: string | null;
}) {
  revalidatePath("/admin/profesionales");
  revalidatePath("/admin/empresas");
  revalidatePath("/red");
  if (user.professionalId) revalidatePath(`/admin/profesionales/${user.professionalId}`);
  if (user.companyId) revalidatePath(`/admin/empresas/${user.companyId}`);
}

/** Suspende (deshabilita) o reactiva una cuenta. */
export async function adminSetAccountDisabledAction(
  userId: string,
  disabled: boolean
): Promise<AccountResult> {
  await requireAdmin();
  const user = await data.getUserAccount(userId);
  if (!user) return { ok: false, error: "No se encontró la cuenta." };
  if (user.role === "admin") return { ok: false, error: "No se puede suspender una cuenta de admin." };
  if (user.deletedAt) return { ok: false, error: "La cuenta está eliminada." };
  if (disabled) await data.adminDisableUser(userId);
  else await data.adminReactivateUser(userId);
  revalidateAccountPaths(user);
  return { ok: true };
}

/** Elimina (soft-delete + anonimización) una cuenta. Irreversible. */
export async function adminDeleteAccountAction(userId: string): Promise<AccountResult> {
  await requireAdmin();
  const user = await data.getUserAccount(userId);
  if (!user) return { ok: false, error: "No se encontró la cuenta." };
  if (user.role === "admin") return { ok: false, error: "No se puede eliminar una cuenta de admin." };
  if (user.deletedAt) return { ok: false, error: "La cuenta ya está eliminada." };
  await data.softDeleteUser(userId);
  revalidateAccountPaths(user);
  return { ok: true };
}

/** Reenvía el mail de verificación de email a una cuenta sin verificar. */
export async function adminResendVerificationAction(userId: string): Promise<AccountResult> {
  await requireAdmin();
  const user = await data.getUserAccount(userId);
  if (!user) return { ok: false, error: "No se encontró la cuenta." };
  if (user.deletedAt) return { ok: false, error: "La cuenta está eliminada." };
  if (user.emailVerified) return { ok: false, error: "El email ya está verificado." };
  const token = await data.createEmailVerificationToken(userId);
  await sendVerificationEmail({ nombre: user.nombre, email: user.email, url: verificationUrl(token) });
  return { ok: true };
}

/** Le manda al usuario un mail para restablecer su contraseña. */
export async function adminSendPasswordResetAction(userId: string): Promise<AccountResult> {
  await requireAdmin();
  const user = await data.getUserAccount(userId);
  if (!user) return { ok: false, error: "No se encontró la cuenta." };
  if (user.deletedAt) return { ok: false, error: "La cuenta está eliminada." };
  const token = await data.createPasswordResetToken(userId);
  await sendPasswordResetEmail({ nombre: user.nombre, email: user.email, url: resetUrl(token) });
  return { ok: true };
}

// --- Contacto empresa → freelancer -------------------------------------------

export async function contactFreelancerAction(professionalId: string) {
  const session = await auth();
  if (session?.user?.role !== "empresa" || !session.user.companyId) {
    return { ok: false, error: "No autorizado" };
  }
  const companyId = session.user.companyId;

  const existing = await data.findActiveContact(companyId, professionalId);
  if (existing) {
    return { ok: true, already: true, contactId: existing.id };
  }

  const prof = await data.getProfessional(professionalId);
  if (!prof) return { ok: false, error: "Perfil no encontrado" };

  const [company, contact] = await Promise.all([
    data.getEmpresaData(companyId),
    data.createContact(companyId, professionalId),
  ]);
  if (company) {
    await sendContactRequestEmail({
      freelancerNombre: prof.nombre,
      freelancerEmail: prof.email,
      empresaNombre: company.nombre,
      empresaDescripcion: company.descripcion,
      empresaRubro: company.rubro,
      url: contactUrl(contact.id),
    });
  }

  revalidatePath("/cuenta/contactos");
  revalidatePath(`/red/${professionalId}`);
  return { ok: true, already: false, contactId: contact.id };
}

export async function markContactReadAction(contactId: string) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false };
  }
  await data.markContactRead(contactId, session.user.professionalId);
  revalidatePath("/cuenta/contactos");
  return { ok: true };
}

// --- Portfolio del freelancer -------------------------------------------------

export async function addPortfolioItemAction(input: {
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  enlace?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const professionalId = session.user.professionalId;
  const titulo = input.titulo.trim();
  const descripcion = input.descripcion.trim();
  const enlace = (input.enlace ?? "").trim();

  if (!titulo || !descripcion) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  if (titulo.length > PORTFOLIO_LIMITS.proyectoTitulo) {
    return { ok: false, error: `El título no puede superar ${PORTFOLIO_LIMITS.proyectoTitulo} caracteres` };
  }
  if (descripcion.length > PORTFOLIO_LIMITS.proyectoDescripcion) {
    return { ok: false, error: `La descripción no puede superar ${PORTFOLIO_LIMITS.proyectoDescripcion} caracteres` };
  }
  if (enlace.length > PORTFOLIO_LIMITS.enlace) {
    return { ok: false, error: `El link no puede superar ${PORTFOLIO_LIMITS.enlace} caracteres` };
  }

  const badTitulo = checkText(titulo, { field: "El título", maxUrls: 0 });
  if (badTitulo) return { ok: false, error: badTitulo };
  const badDesc = checkText(descripcion, { field: "La descripción" });
  if (badDesc) return { ok: false, error: badDesc };

  const badImg = checkBlobImage(input.imagenUrl);
  if (badImg) return { ok: false, error: badImg };

  let enlaceFinal: string | undefined;
  if (enlace) {
    const normalized = normalizeExternalUrl(enlace);
    if (!normalized) {
      return { ok: false, error: "El link no parece una URL válida (ej. https://tusitio.com)" };
    }
    const unsafe = await checkUrlSafe(normalized);
    if (unsafe) return { ok: false, error: unsafe };
    enlaceFinal = normalized;
  }

  const count = await data.countPortfolioItems(professionalId);
  if (count >= PORTFOLIO_LIMITS.proyectosMax) {
    return { ok: false, error: `Llegaste al máximo de ${PORTFOLIO_LIMITS.proyectosMax} proyectos` };
  }

  await data.createPortfolioItem({
    professionalId,
    titulo,
    descripcion,
    imagenUrl: input.imagenUrl || undefined,
    enlace: enlaceFinal,
  });
  revalidatePath("/cuenta");
  revalidatePath(`/red/${professionalId}`);
  return { ok: true };
}

export async function updatePortfolioItemAction(input: {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string | null;
  enlace?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const professionalId = session.user.professionalId;
  const titulo = input.titulo.trim();
  const descripcion = input.descripcion.trim();
  const enlace = (input.enlace ?? "").trim();

  if (!input.id) {
    return { ok: false, error: "Falta el proyecto a editar" };
  }
  if (!titulo || !descripcion) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  if (titulo.length > PORTFOLIO_LIMITS.proyectoTitulo) {
    return { ok: false, error: `El título no puede superar ${PORTFOLIO_LIMITS.proyectoTitulo} caracteres` };
  }
  if (descripcion.length > PORTFOLIO_LIMITS.proyectoDescripcion) {
    return { ok: false, error: `La descripción no puede superar ${PORTFOLIO_LIMITS.proyectoDescripcion} caracteres` };
  }
  if (enlace.length > PORTFOLIO_LIMITS.enlace) {
    return { ok: false, error: `El link no puede superar ${PORTFOLIO_LIMITS.enlace} caracteres` };
  }

  const badTitulo = checkText(titulo, { field: "El título", maxUrls: 0 });
  if (badTitulo) return { ok: false, error: badTitulo };
  const badDesc = checkText(descripcion, { field: "La descripción" });
  if (badDesc) return { ok: false, error: badDesc };

  const badImg = checkBlobImage(input.imagenUrl);
  if (badImg) return { ok: false, error: badImg };

  let enlaceFinal: string | null = null;
  if (enlace) {
    const normalized = normalizeExternalUrl(enlace);
    if (!normalized) {
      return { ok: false, error: "El link no parece una URL válida (ej. https://tusitio.com)" };
    }
    const unsafe = await checkUrlSafe(normalized);
    if (unsafe) return { ok: false, error: unsafe };
    enlaceFinal = normalized;
  }

  const updated = await data.updatePortfolioItem(input.id, professionalId, {
    titulo,
    descripcion,
    imagenUrl: input.imagenUrl ?? null,
    enlace: enlaceFinal,
  });
  if (!updated) return { ok: false, error: "No se encontró el proyecto" };
  revalidatePath("/cuenta");
  revalidatePath(`/red/${professionalId}`);
  return { ok: true };
}

/** Guarda la descripción general y las (hasta 3) imágenes del portfolio. */
export async function savePortfolioAction(input: {
  descripcion: string;
  imagenes: string[];
}) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const descripcion = input.descripcion.trim();
  if (descripcion.length > PORTFOLIO_LIMITS.descripcion) {
    return { ok: false, error: `La descripción no puede superar ${PORTFOLIO_LIMITS.descripcion} caracteres` };
  }
  const badDesc = checkText(descripcion, { field: "La descripción" });
  if (badDesc) return { ok: false, error: badDesc };

  const imagenes = input.imagenes.filter(Boolean).slice(0, PORTFOLIO_LIMITS.imagenesMax);
  for (const url of imagenes) {
    const badImg = checkBlobImage(url);
    if (badImg) return { ok: false, error: badImg };
  }

  await data.updateProfessional(session.user.professionalId, {
    portfolioDescripcion: descripcion || null,
    portfolioImagenes: imagenes,
  });
  revalidatePath("/cuenta");
  revalidatePath(`/red/${session.user.professionalId}`);
  return { ok: true };
}

/** Sube una imagen del portfolio (galería o proyecto) y devuelve su URL. */
export async function uploadPortfolioImageAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const professionalId = session.user.professionalId;
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No se recibió ningún archivo" };
  }

  const okRate = await checkRateLimit(`portfolio-upload:${professionalId}`, {
    max: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  try {
    const url = await uploadProfilePhoto(file, `portfolio/professional-${professionalId}`);
    return { ok: true, url };
  } catch (e) {
    if (e instanceof InvalidPhotoError) return { ok: false, error: e.message };
    console.error("[upload] error al subir imagen de portfolio:", e);
    return { ok: false, error: "No se pudo subir la imagen. Probá de nuevo." };
  }
}

export async function deletePortfolioItemAction(itemId: string) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const deleted = await data.deletePortfolioItem(itemId, session.user.professionalId);
  if (!deleted) return { ok: false, error: "No se encontró el ítem" };
  revalidatePath("/cuenta");
  revalidatePath(`/red/${session.user.professionalId}`);
  return { ok: true };
}

export async function uploadFreelancerPhotoAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const professionalId = session.user.professionalId;
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No se recibió ningún archivo" };
  }

  const okRate = await checkRateLimit(`photo-upload:${professionalId}`, {
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  try {
    const prof = await data.getProfessional(professionalId);
    const url = await uploadProfilePhoto(file, `avatars/professional-${professionalId}`, prof?.fotoUrl);
    await data.updateProfessional(professionalId, { fotoUrl: url });
    revalidatePath("/cuenta");
    revalidatePath(`/red/${professionalId}`);
    return { ok: true, url };
  } catch (e) {
    if (e instanceof InvalidPhotoError) return { ok: false, error: e.message };
    console.error("[upload] error al subir foto de freelancer:", e);
    return { ok: false, error: "No se pudo subir la imagen. Probá de nuevo." };
  }
}

/** Edición de la card de presentación del freelancer. */
export async function updateFreelancerProfileAction(input: {
  nombre: string;
  titular: string;
  descripcion: string;
  roles: string[];
  experiencia: string;
  modalidad: string;
  disponibilidad: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const nombre = input.nombre.trim();
  const titular = input.titular.trim();
  const descripcion = input.descripcion.trim();

  if (!nombre || !titular || !descripcion) {
    return { ok: false, error: "Nombre, titular y descripción son obligatorios" };
  }
  if (nombre.length > 80) return { ok: false, error: "El nombre no puede superar 80 caracteres" };
  if (titular.length > 80) return { ok: false, error: "El titular no puede superar 80 caracteres" };
  if (descripcion.length > 500) return { ok: false, error: "La descripción no puede superar 500 caracteres" };

  for (const [value, field, maxUrls] of [
    [nombre, "El nombre", 0],
    [titular, "El titular", 0],
    [descripcion, "La descripción", 1],
  ] as const) {
    const bad = checkText(value, { field, maxUrls });
    if (bad) return { ok: false, error: bad };
  }

  const roles = input.roles
    .filter((r) => (ROLES as readonly string[]).includes(r))
    .slice(0, 5);
  if (roles.length === 0) return { ok: false, error: "Elegí al menos un rol" };
  if (!(EXPERIENCIAS as readonly string[]).includes(input.experiencia)) {
    return { ok: false, error: "Experiencia inválida" };
  }
  if (!(MODALIDADES as readonly string[]).includes(input.modalidad)) {
    return { ok: false, error: "Modalidad inválida" };
  }
  if (!(DISPONIBILIDADES as readonly string[]).includes(input.disponibilidad)) {
    return { ok: false, error: "Disponibilidad inválida" };
  }

  await data.updateProfessional(session.user.professionalId, {
    nombre,
    titular,
    descripcion,
    roles,
    experiencia: input.experiencia,
    modalidad: input.modalidad,
    disponibilidad: input.disponibilidad,
  });
  revalidatePath("/cuenta");
  revalidatePath(`/red/${session.user.professionalId}`);
  return { ok: true };
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

/** Guarda los links de redes del freelancer (normaliza y valida cada URL). */
export async function updateFreelancerSocialsAction(input: {
  instagram: string;
  facebook: string;
  linkedin: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "freelancer" || !session.user.professionalId) {
    return { ok: false, error: "No autorizado" };
  }
  const fields: Record<string, string | null> = {};
  for (const key of ["instagram", "facebook", "linkedin"] as const) {
    const val = input[key].trim();
    if (!val) {
      fields[key] = null;
      continue;
    }
    const url = normalizeExternalUrl(val);
    if (!url) {
      return {
        ok: false,
        error: `El link de ${SOCIAL_LABELS[key]} no parece una URL válida (ej. https://…)`,
      };
    }
    const unsafe = await checkUrlSafe(url);
    if (unsafe) return { ok: false, error: `${SOCIAL_LABELS[key]}: ${unsafe}` };
    fields[key] = url;
  }
  await data.updateProfessional(session.user.professionalId, fields);
  revalidatePath("/cuenta");
  revalidatePath(`/red/${session.user.professionalId}`);
  return { ok: true };
}

// --- Perfil de empresa ---------------------------------------------------------

export async function updateCompanyProfileAction(input: {
  descripcion?: string;
  logoUrl?: string;
  linkedin?: string;
  instagram?: string;
  ubicacion?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "empresa" || !session.user.companyId) {
    return { ok: false, error: "No autorizado" };
  }

  if (input.descripcion) {
    const bad = checkText(input.descripcion, { field: "La descripción" });
    if (bad) return { ok: false, error: bad };
  }

  const badLogo = checkBlobImage(input.logoUrl);
  if (badLogo) return { ok: false, error: badLogo };

  const clean: typeof input = { ...input };
  for (const key of ["linkedin", "instagram"] as const) {
    const val = input[key]?.trim();
    if (!val) {
      clean[key] = undefined;
      continue;
    }
    const url = normalizeExternalUrl(val);
    if (!url) return { ok: false, error: `El link de ${key} no parece una URL válida (ej. https://…)` };
    const unsafe = await checkUrlSafe(url);
    if (unsafe) return { ok: false, error: `${key}: ${unsafe}` };
    clean[key] = url;
  }

  await data.updateCompanyProfile(session.user.companyId, clean);
  revalidatePath("/cuenta");
  return { ok: true };
}

export async function uploadCompanyLogoAction(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "empresa" || !session.user.companyId) {
    return { ok: false, error: "No autorizado" };
  }
  const companyId = session.user.companyId;
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No se recibió ningún archivo" };
  }

  const okRate = await checkRateLimit(`photo-upload:${companyId}`, {
    max: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  try {
    const company = await data.getEmpresaData(companyId);
    const url = await uploadProfilePhoto(file, `avatars/company-${companyId}`, company?.logoUrl);
    await data.updateCompanyProfile(companyId, { logoUrl: url });
    revalidatePath("/cuenta");
    return { ok: true, url };
  } catch (e) {
    if (e instanceof InvalidPhotoError) return { ok: false, error: e.message };
    console.error("[upload] error al subir logo de empresa:", e);
    return { ok: false, error: "No se pudo subir la imagen. Probá de nuevo." };
  }
}

// --- Reportes de contenido ---------------------------------------------------

/** Cualquier usuario logueado puede reportar un perfil. Rate-limit + dedupe. */
export async function reportProfileAction(input: {
  professionalId: string;
  motivo: string;
  detalle?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Tenés que iniciar sesión para reportar." };
  }
  if (!input.professionalId) {
    return { ok: false, error: "Falta el perfil a reportar." };
  }
  if (!(REPORTE_MOTIVOS as readonly string[]).includes(input.motivo)) {
    return { ok: false, error: "Elegí un motivo válido." };
  }
  const detalle = (input.detalle ?? "").trim();
  if (detalle.length > 500) {
    return { ok: false, error: "El detalle no puede superar 500 caracteres." };
  }

  // No podés reportar tu propio perfil.
  if (session.user.professionalId === input.professionalId) {
    return { ok: false, error: "No podés reportar tu propio perfil." };
  }

  const okRate = await checkRateLimit(`report:${session.user.id}`, {
    max: 10,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Alcanzaste el máximo de reportes por hoy." };
  }

  if (await data.hasPendingReportFrom(input.professionalId, session.user.id)) {
    return { ok: true, already: true };
  }

  const prof = await data.getProfessional(input.professionalId);
  if (!prof) return { ok: false, error: "El perfil no existe." };

  const ip = await getClientIp();
  await data.createReport({
    professionalId: input.professionalId,
    motivo: input.motivo,
    detalle: detalle || null,
    reporterUserId: session.user.id,
    reporterIp: ip,
  });
  revalidatePath("/admin/reportes");
  revalidatePath("/admin");
  return { ok: true, already: false };
}

export async function setReportEstadoAction(id: string, estado: EstadoReporte) {
  await requireAdmin();
  await data.setReportEstado(id, estado);
  revalidatePath("/admin/reportes");
  revalidatePath("/admin");
}

/** Desde un reporte: oculta el perfil del directorio y marca el reporte revisado. */
export async function hideReportedProfileAction(
  reportId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const report = await data.getReport(reportId);
  if (!report?.professionalId) {
    return { ok: false, error: "El reporte no tiene un perfil asociado." };
  }
  await data.setProfessionalEstado(report.professionalId, "oculto");
  await data.setReportEstado(reportId, "revisado");
  revalidatePath("/admin/reportes");
  revalidatePath("/admin");
  revalidatePath("/red");
  revalidatePath(`/red/${report.professionalId}`);
  revalidatePath(`/admin/profesionales/${report.professionalId}`);
  return { ok: true };
}

/** Desde un reporte: suspende la cuenta del profesional y marca el reporte revisado. */
export async function suspendReportedAccountAction(
  reportId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const report = await data.getReport(reportId);
  if (!report?.professionalId) {
    return { ok: false, error: "El reporte no tiene un perfil asociado." };
  }
  const account = await data.getAccountByProfessionalId(report.professionalId);
  if (!account) return { ok: false, error: "El perfil no tiene cuenta de usuario." };
  if (account.deletedAt) return { ok: false, error: "La cuenta está eliminada." };
  await data.adminDisableUser(account.id);
  await data.setReportEstado(reportId, "revisado");
  revalidatePath("/admin/reportes");
  revalidatePath("/admin");
  revalidatePath("/red");
  revalidatePath(`/red/${report.professionalId}`);
  return { ok: true };
}

// --- Google Calendar ---------------------------------------------------------

export async function disconnectCalendarAction() {
  await requireAdmin();
  await data.deleteCalendarConnection();
  revalidatePath("/admin/calendario");
}

/** Access token válido de la cuenta del estudio (o null si no hay conexión). */
async function getStudioAccessToken() {
  const conn = await data.getCalendarConnection();
  if (!conn) return null;
  const accessToken = await refreshAccessToken(decryptSecret(conn.refreshToken));
  return { accessToken, calendarId: conn.calendarId };
}

export async function scheduleMeetingAction(input: {
  companyId: string;
  diagnosisId?: string;
  fecha: string; // "YYYY-MM-DD"
  hora: string; // "HH:mm"
  duracionMin?: number;
  titulo?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") return { ok: false, error: "No autorizado" };

  const company = await data.getEmpresaData(input.companyId);
  if (!company) return { ok: false, error: "No se encontró la empresa." };

  // Argentina: offset fijo -03:00 (sin horario de verano).
  const startsAt = new Date(`${input.fecha}T${input.hora}:00-03:00`);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Fecha u hora inválida." };
  const dur = Math.min(240, Math.max(15, Math.round(input.duracionMin || 45)));
  const endsAt = new Date(startsAt.getTime() + dur * 60_000);

  const titulo = (input.titulo?.trim() || `Sesión de consulta — ${company.nombre}`).slice(0, 200);

  let conn: Awaited<ReturnType<typeof getStudioAccessToken>>;
  try {
    conn = await getStudioAccessToken();
  } catch (e) {
    console.error("[calendar] token:", e);
    return { ok: false, error: "El calendario del estudio necesita reconectarse." };
  }
  if (!conn) {
    return { ok: false, error: "Primero conectá el calendario del estudio en Calendario." };
  }

  // Invitados: la empresa + todos los admins (para que a cada uno le aparezca en
  // SU Google Calendar, además de verlo en la plataforma).
  const adminEmails = await data.listAdminEmails();

  let event;
  try {
    event = await createCalendarEvent(conn.accessToken, conn.calendarId, {
      summary: titulo,
      description: `Sesión de consulta de Sinnergia con ${company.nombre}.`,
      startISO: startsAt.toISOString(),
      endISO: endsAt.toISOString(),
      attendeeEmails: [company.email, ...adminEmails],
    });
  } catch (e) {
    console.error("[calendar] createEvent:", e);
    return {
      ok: false,
      error: "No se pudo crear el evento en Google Calendar. Reconectá el calendario e intentá de nuevo.",
    };
  }

  // Si no vino un diagnóstico explícito (ej. se agenda desde el calendario), se
  // usa el más reciente de la empresa.
  const latest = company.diagnoses[0];
  const diagnosisId = input.diagnosisId ?? latest?.id ?? null;

  await data.createMeeting({
    companyId: input.companyId,
    diagnosisId,
    scheduledById: session.user.id,
    titulo,
    startsAt,
    endsAt,
    googleEventId: event.id,
    meetUrl: event.meetUrl,
    htmlLink: event.htmlLink,
  });

  // Si el lead más reciente está "nuevo", agendar lo mueve a "en conversación".
  if (diagnosisId && latest?.estadoLead === "nuevo") {
    await data.updateLead(diagnosisId, { estadoLead: "en_conversacion" });
  }

  revalidatePath(`/admin/empresas/${input.companyId}`);
  revalidatePath("/admin/empresas");
  revalidatePath("/admin/calendario");
  return { ok: true, meetUrl: event.meetUrl };
}

export async function cancelMeetingAction(meetingId: string) {
  await requireAdmin();
  const meeting = await data.getMeeting(meetingId);
  if (!meeting) return { ok: false, error: "No se encontró la sesión." };

  if (meeting.googleEventId) {
    try {
      const conn = await getStudioAccessToken();
      if (conn) await deleteCalendarEvent(conn.accessToken, conn.calendarId, meeting.googleEventId);
    } catch (e) {
      // Si falla el borrado en Google, igual cancelamos de nuestro lado.
      console.error("[calendar] deleteEvent:", e);
    }
  }
  await data.markMeetingCancelled(meetingId);
  revalidatePath(`/admin/empresas/${meeting.companyId}`);
  revalidatePath("/admin/calendario");
  return { ok: true };
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
  password: string;
  confirmPassword: string;
}) {
  if (!input.nombre || !input.email || !input.titular) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, error: "Las contraseñas no coinciden" };
  }
  if (!isPasswordValid(input.password)) {
    return { ok: false, error: PASSWORD_HINT };
  }

  for (const [value, field, maxUrls] of [
    [input.nombre, "El nombre", 0],
    [input.titular, "El titular", 0],
    [input.descripcion ?? "", "La descripción", 1],
  ] as const) {
    const bad = checkText(value, { field, maxUrls });
    if (bad) return { ok: false, error: bad };
  }

  const cleanUrls: Partial<Pick<typeof input, "portfolioUrl" | "linkedin" | "instagram">> = {};
  for (const key of ["portfolioUrl", "linkedin", "instagram"] as const) {
    const val = input[key]?.trim();
    if (!val) continue;
    const url = normalizeExternalUrl(val);
    if (!url) return { ok: false, error: `El link de ${key} no parece una URL válida (ej. https://…)` };
    const unsafe = await checkUrlSafe(url);
    if (unsafe) return { ok: false, error: `${key}: ${unsafe}` };
    cleanUrls[key] = url;
  }

  const ip = await getClientIp();
  const okRate = await checkRateLimit(`register:ip:${ip}`, {
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  if (await data.findUserByEmail(input.email)) {
    return {
      ok: false,
      error: "Ya existe una cuenta con ese email. Iniciá sesión.",
    };
  }

  const passwordHash = await hashPassword(input.password);
  const { user } = await data.createProfessionalWithAccount({
    ...input,
    ...cleanUrls,
    passwordHash,
  });
  const token = await data.createEmailVerificationToken(user.id);

  await notifyNewApplication({ nombre: input.nombre, titular: input.titular, email: input.email });
  await sendApplicationConfirmation({ nombre: input.nombre, email: input.email });
  await sendVerificationEmail({
    nombre: input.nombre,
    email: input.email,
    url: verificationUrl(token),
  });
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
  password: string;
  confirmPassword: string;
}) {
  if (!input.nombre || !input.email || !input.objetivos || !input.problemaPrincipal) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, error: "Las contraseñas no coinciden" };
  }
  if (!isPasswordValid(input.password)) {
    return { ok: false, error: PASSWORD_HINT };
  }

  const ip = await getClientIp();
  const okRate = await checkRateLimit(`register:ip:${ip}`, {
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  if (await data.findUserByEmail(input.email)) {
    return {
      ok: false,
      error: "Ya existe una cuenta con ese email. Iniciá sesión.",
    };
  }

  const passwordHash = await hashPassword(input.password);
  const { user, company } = await data.createCompanyWithAccount({
    ...input,
    passwordHash,
  });
  const token = await data.createEmailVerificationToken(user.id);

  const adminEmails = await data.listAdminEmails();
  await notifyNewDiagnosis({
    to: adminEmails,
    detailUrl: `${SITE_URL}/admin/empresas/${company.id}`,
    company: {
      nombre: input.nombre,
      contacto: input.contacto,
      email: input.email,
      telefono: input.telefono,
      rubro: input.rubro,
      tamano: input.tamano,
      sitioWeb: input.sitioWeb,
    },
    diagnosis: {
      objetivos: input.objetivos,
      presupuesto: input.presupuesto,
      facturacion: input.facturacion,
      equipoActual: input.equipoActual,
      problemaPrincipal: input.problemaPrincipal,
    },
  });
  await sendDiagnosisConfirmation({ nombre: input.nombre, email: input.email });
  await sendVerificationEmail({
    nombre: input.nombre,
    email: input.email,
    url: verificationUrl(token),
  });
  revalidatePath("/admin/empresas");
  return { ok: true };
}

/** Para una empresa YA logueada: agrega un diagnóstico nuevo, sin volver a pedir cuenta. */
export async function addDiagnosisAction(input: {
  facturacion?: string;
  objetivos: string;
  presupuesto: string;
  equipoActual?: string;
  problemaPrincipal: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "empresa" || !session.user.companyId) {
    return { ok: false, error: "No autorizado" };
  }
  if (!input.objetivos || !input.problemaPrincipal || !input.presupuesto) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }

  const company = await data.getEmpresaData(session.user.companyId);
  if (!company) return { ok: false, error: "No se encontró tu empresa" };

  await data.createDiagnosisForCompany(session.user.companyId, {
    rubro: company.rubro,
    facturacion: input.facturacion,
    objetivos: input.objetivos,
    presupuesto: input.presupuesto,
    equipoActual: input.equipoActual,
    problemaPrincipal: input.problemaPrincipal,
  });
  const adminEmails = await data.listAdminEmails();
  await notifyNewDiagnosis({
    to: adminEmails,
    detailUrl: `${SITE_URL}/admin/empresas/${session.user.companyId}`,
    company: {
      nombre: company.nombre,
      contacto: company.contacto,
      email: company.email,
      telefono: company.telefono,
      rubro: company.rubro,
      tamano: company.tamano,
      sitioWeb: company.sitioWeb,
    },
    diagnosis: {
      objetivos: input.objetivos,
      presupuesto: input.presupuesto,
      facturacion: input.facturacion,
      equipoActual: input.equipoActual,
      problemaPrincipal: input.problemaPrincipal,
    },
  });
  revalidatePath("/admin/empresas");
  revalidatePath("/cuenta");
  return { ok: true };
}

// --- Alta vía Google (onboarding) --------------------------------------------
// El usuario ya se autenticó con Google (email verificado); acá elige tipo y
// completa los datos mínimos. No hay contraseña: entra siempre con Google (o
// puede crearse una después con "recuperar contraseña"). Al final, reiniciamos
// el login con Google para dejar la sesión establecida.

export async function completeGoogleRegistrationAction(
  input:
    | { token: string; tipo: "freelancer"; nombre: string; titular: string }
    | { token: string; tipo: "empresa"; nombre: string; contacto: string; rubro: string }
): Promise<{ ok: false; error: string } | void> {
  const identity = verifyOnboardingToken(input.token);
  if (!identity) {
    return { ok: false, error: "El enlace de registro venció. Volvé a entrar con Google." };
  }
  const email = identity.email.toLowerCase();

  // Carrera: si ya se creó una cuenta con ese email, no duplicar.
  if (await data.findUserByEmail(email)) {
    return { ok: false, error: "Ya existe una cuenta con ese email. Iniciá sesión." };
  }

  const nombre = input.nombre.trim();
  if (!nombre) return { ok: false, error: "Faltan datos obligatorios" };
  const badNombre = checkText(nombre, { field: "El nombre", maxUrls: 0 });
  if (badNombre) return { ok: false, error: badNombre };

  if (input.tipo === "freelancer") {
    if (!ROLES.includes(input.titular)) {
      return { ok: false, error: "Elegí un rol principal válido" };
    }
    await data.createProfessionalWithAccount({
      nombre,
      email,
      titular: input.titular,
      descripcion: "",
      roles: [input.titular],
      rubros: [],
      experiencia: EXPERIENCIAS[0],
      honorarios: PRESUPUESTOS[0],
      modalidad: MODALIDADES[0],
      disponibilidad: DISPONIBILIDADES[0],
      googleId: identity.sub || null,
      image: identity.image,
      emailVerified: new Date(),
    });
    revalidatePath("/admin/profesionales");
  } else {
    const contacto = input.contacto.trim();
    if (!contacto) return { ok: false, error: "Falta la persona de contacto" };
    if (!RUBROS.includes(input.rubro)) {
      return { ok: false, error: "Elegí un rubro válido" };
    }
    await data.createCompanyAccount({
      nombre,
      contacto,
      email,
      rubro: input.rubro,
      googleId: identity.sub || null,
      image: identity.image,
      emailVerified: new Date(),
    });
    revalidatePath("/admin/empresas");
  }

  // La cuenta ya existe → reiniciamos el login con Google para dejar la sesión
  // hecha. Como ya consintió, es un redirect silencioso. (signIn lanza redirect.)
  await signIn("google", { redirectTo: "/cuenta" });
}

// --- Alta rápida de cuenta (desde /login → /crear-cuenta) -------------------
// Pide sólo los datos mínimos; el resto del perfil se completa después
// (vía /sumate, /diagnostico o, más adelante, edición desde /cuenta).

export async function registerAccountAction(
  input:
    | {
        tipo: "freelancer";
        nombre: string;
        email: string;
        titular: string;
        password: string;
        confirmPassword: string;
      }
    | {
        tipo: "empresa";
        nombre: string;
        contacto: string;
        email: string;
        rubro: string;
        password: string;
        confirmPassword: string;
      }
) {
  if (!input.nombre || !input.email) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  if (input.tipo === "freelancer" && !ROLES.includes(input.titular)) {
    return { ok: false, error: "Elegí un rol principal válido" };
  }
  if (input.tipo === "empresa" && !input.contacto) {
    return { ok: false, error: "Faltan datos obligatorios" };
  }
  if (input.tipo === "empresa" && !RUBROS.includes(input.rubro)) {
    return { ok: false, error: "Elegí un rubro válido" };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, error: "Las contraseñas no coinciden" };
  }
  if (!isPasswordValid(input.password)) {
    return { ok: false, error: PASSWORD_HINT };
  }

  const ip = await getClientIp();
  const okRate = await checkRateLimit(`register:ip:${ip}`, {
    max: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  if (await data.findUserByEmail(input.email)) {
    return {
      ok: false,
      error: "Ya existe una cuenta con ese email. Iniciá sesión.",
    };
  }

  const passwordHash = await hashPassword(input.password);

  const user =
    input.tipo === "freelancer"
      ? (
          await data.createProfessionalWithAccount({
            nombre: input.nombre,
            email: input.email,
            titular: input.titular,
            descripcion: "",
            roles: [input.titular],
            rubros: [],
            experiencia: EXPERIENCIAS[0],
            honorarios: PRESUPUESTOS[0],
            modalidad: MODALIDADES[0],
            disponibilidad: DISPONIBILIDADES[0],
            passwordHash,
          })
        ).user
      : (
          await data.createCompanyAccount({
            nombre: input.nombre,
            contacto: input.contacto,
            email: input.email,
            rubro: input.rubro,
            passwordHash,
          })
        ).user;

  const token = await data.createEmailVerificationToken(user.id);
  await sendVerificationEmail({
    nombre: input.nombre,
    email: input.email,
    url: verificationUrl(token),
  });

  if (input.tipo === "freelancer") {
    revalidatePath("/admin/profesionales");
  } else {
    revalidatePath("/admin/empresas");
  }
  return { ok: true };
}

// --- Verificación de email y recuperación de contraseña ---------------------

export async function resendVerificationAction(email: string) {
  const generic = {
    ok: true as const,
    message:
      "Si existe una cuenta pendiente de verificación con ese email, te reenviamos el enlace.",
  };
  if (!email) return generic;

  const ip = await getClientIp();
  const okRate = await checkRateLimit(`resend-verify:ip:${ip}`, {
    max: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!okRate) return generic;

  const user = await data.findUserByEmail(email);
  if (!user || user.emailVerified) return generic;

  const token = await data.createEmailVerificationToken(user.id);
  await sendVerificationEmail({
    nombre: user.nombre,
    email: user.email,
    url: verificationUrl(token),
  });
  return generic;
}

export async function requestPasswordResetAction(email: string) {
  const generic = {
    ok: true as const,
    message:
      "Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña.",
  };
  if (!email) return generic;

  const ip = await getClientIp();
  const [okIp, okEmail] = await Promise.all([
    checkRateLimit(`forgot:ip:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 }),
    checkRateLimit(`forgot:email:${email}`, { max: 3, windowMs: 15 * 60 * 1000 }),
  ]);
  if (!okIp || !okEmail) return generic;

  const user = await data.findUserByEmail(email);
  if (!user) return generic;

  const token = await data.createPasswordResetToken(user.id);
  await sendPasswordResetEmail({
    nombre: user.nombre,
    email: user.email,
    url: resetUrl(token),
  });
  return generic;
}

export async function resetPasswordAction(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  if (!input.token) {
    return { ok: false, error: "El enlace no es válido o expiró." };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, error: "Las contraseñas no coinciden" };
  }
  if (!isPasswordValid(input.password)) {
    return { ok: false, error: PASSWORD_HINT };
  }

  const ip = await getClientIp();
  const okRate = await checkRateLimit(`reset:ip:${ip}`, {
    max: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!okRate) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }

  const passwordHash = await hashPassword(input.password);
  const result = await data.consumePasswordResetToken(input.token, passwordHash);
  if (!result.ok) {
    return { ok: false, error: "El enlace no es válido o expiró. Solicitá uno nuevo." };
  }
  return { ok: true };
}
