/**
 * Tipos del dominio de Sinnergia.
 *
 * Fuente única de verdad para las entidades. En la Fase 2 estos tipos se alinean
 * con el esquema de Prisma (ver src/lib/schema-notes.md). Por ahora se usan con
 * datos mock (src/lib/mock-data.ts).
 */

// --- Enumeraciones ------------------------------------------------------------

export type UserRole = "freelancer" | "empresa" | "admin";

export type Experiencia = "Junior" | "Semi Senior" | "Senior";

export type Modalidad = "Remoto" | "Presencial" | "Híbrido";

/** Rango de honorarios orientativo. */
export type Presupuesto = "$" | "$$" | "$$$" | "$$$$";

export type Disponibilidad = "Inmediata" | "1-2 semanas" | "Más de 2 semanas" | "No disponible";

/** Estado de moderación de un perfil profesional. */
export type EstadoProfesional = "pendiente" | "aprobado" | "rechazado" | "oculto";

/** Estado de un lead / diagnóstico en el funnel. */
export type EstadoLead =
  | "nuevo"
  | "en_conversacion"
  | "propuesta_enviada"
  | "cerrado_ganado"
  | "cerrado_perdido";

/** Estado de una solicitud de match. */
export type EstadoMatch = "solicitado" | "en_gestion" | "cerrado" | "descartado";

// --- Entidades ----------------------------------------------------------------

export interface Professional {
  id: string;
  // Identidad
  nombre: string;
  email: string;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  portfolioUrl?: string;
  fotoUrl?: string;
  // Perfil profesional
  titular: string; // rol principal, ej. "Filmmaker"
  descripcion: string;
  roles: string[]; // ids/nombres de catálogo de roles
  rubros: string[]; // rubros en los que trabaja
  experiencia: Experiencia;
  honorarios: Presupuesto;
  modalidad: Modalidad;
  disponibilidad: Disponibilidad;
  // Moderación
  estado: EstadoProfesional;
  destacado: boolean;
  createdAt: string; // ISO
}

export interface Company {
  id: string;
  nombre: string;
  contacto: string; // persona de contacto
  email: string;
  telefono?: string;
  rubro: string;
  tamano?: string; // ej. "1-10", "11-50"
  sitioWeb?: string;
  origen?: string; // cómo llegó el lead
  createdAt: string;
}

export interface Diagnosis {
  id: string;
  companyId: string;
  // Respuestas estructuradas (materia prima del match)
  rubro: string;
  facturacion?: string;
  objetivos: string;
  presupuesto: Presupuesto;
  equipoActual?: string;
  problemaPrincipal: string;
  // Campos flexibles (preguntas nuevas sin migrar)
  respuestasExtra?: Record<string, string>;
  // Gestión
  estadoLead: EstadoLead;
  notas?: string;
  createdAt: string;
}

export interface MatchRequest {
  id: string;
  companyId: string;
  diagnosisId?: string;
  contexto: string; // qué se busca resolver
  candidatos: MatchCandidate[];
  estado: EstadoMatch;
  resultado?: string;
  createdAt: string;
}

export interface MatchCandidate {
  professionalId: string;
  /** Puntaje 0-100 calculado por reglas (rubro, presupuesto, rol, experiencia…). */
  puntaje: number;
  seleccionado: boolean;
}

export interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "editor";
}

/**
 * Usuario de sesión. En Fase 2 mock (sin auth real); en la conexión con la BD
 * pasa a venir de Auth.js. `professionalId` / `companyId` vinculan al usuario
 * con su entidad de dominio.
 */
export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  professionalId?: string;
  companyId?: string;
}
