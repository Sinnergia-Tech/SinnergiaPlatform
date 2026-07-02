/**
 * Catálogos del dominio. En Fase 2 se vuelven tablas administrables desde el
 * backoffice (no listas hardcodeadas). Por ahora viven acá como fuente única.
 */

import type {
  Disponibilidad,
  Experiencia,
  Modalidad,
  Presupuesto,
} from "./types";

export const ROLES: string[] = [
  "Diseño",
  "Community Management",
  "Paid Media",
  "Filmmaker",
  "Web",
  "Branding",
  "Ecommerce",
  "Producción",
  "Automatización",
  "Programación",
  "Contenido",
];

export const RUBROS: string[] = [
  "Ecommerce",
  "Automotriz",
  "Salud",
  "Eventos",
  "Gastronomía",
  "Industrial",
  "Tecnología",
  "Educación",
  "Retail",
];

export const EXPERIENCIAS: Experiencia[] = ["Junior", "Semi Senior", "Senior"];

export const MODALIDADES: Modalidad[] = ["Remoto", "Presencial", "Híbrido"];

export const PRESUPUESTOS: Presupuesto[] = ["$", "$$", "$$$", "$$$$"];

export const DISPONIBILIDADES: Disponibilidad[] = [
  "Inmediata",
  "1-2 semanas",
  "Más de 2 semanas",
  "No disponible",
];

export const TAMANOS_EMPRESA: string[] = [
  "1-10",
  "11-50",
  "51-200",
  "200+",
];

// Etiquetas legibles para estados -------------------------------------------------

export const ESTADO_PROFESIONAL_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  oculto: "Oculto",
};

export const ESTADO_LEAD_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  en_conversacion: "En conversación",
  propuesta_enviada: "Propuesta enviada",
  cerrado_ganado: "Cerrado · ganado",
  cerrado_perdido: "Cerrado · perdido",
};

export const ESTADO_MATCH_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  en_gestion: "En gestión",
  cerrado: "Cerrado",
  descartado: "Descartado",
};
