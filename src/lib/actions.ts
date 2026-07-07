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
} from "@/lib/types";

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

  let enlaceFinal: string | undefined;
  if (enlace) {
    const normalized = normalizeExternalUrl(enlace);
    if (!normalized) {
      return { ok: false, error: "El link no parece una URL válida (ej. https://tusitio.com)" };
    }
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
  const imagenes = input.imagenes.filter(Boolean).slice(0, PORTFOLIO_LIMITS.imagenesMax);

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
  await data.updateCompanyProfile(session.user.companyId, input);
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
  const { user } = await data.createCompanyWithAccount({
    ...input,
    passwordHash,
  });
  const token = await data.createEmailVerificationToken(user.id);

  await notifyNewDiagnosis({ nombre: input.nombre, email: input.email, rubro: input.rubro });
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
  await notifyNewDiagnosis({ nombre: company.nombre, email: company.email, rubro: company.rubro });
  revalidatePath("/admin/empresas");
  revalidatePath("/cuenta");
  return { ok: true };
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
