/**
 * Datos de ejemplo (mock) para desarrollar la UI sin base de datos.
 * En Fase 2 se reemplazan por consultas reales (Prisma/Postgres).
 */

import type {
  Company,
  Diagnosis,
  MatchRequest,
  Professional,
  SessionUser,
} from "./types";

export const professionals: Professional[] = [
  {
    id: "p1",
    nombre: "Nicolás Ferraro",
    email: "nico@example.com",
    whatsapp: "+54 9 11 5555 1010",
    linkedin: "in/nicoferraro",
    instagram: "@nico.films",
    portfolioUrl: "https://portfolio.example/nico",
    titular: "Filmmaker",
    descripcion:
      "Realizador audiovisual con foco en eventos, automotriz y podcast. Dirección, cámara y post.",
    roles: ["Filmmaker", "Producción", "Contenido"],
    rubros: ["Eventos", "Automotriz"],
    experiencia: "Senior",
    honorarios: "$$",
    modalidad: "Híbrido",
    disponibilidad: "Inmediata",
    estado: "aprobado",
    destacado: true,
    createdAt: "2026-06-18T10:00:00Z",
  },
  {
    id: "p2",
    nombre: "Camila Rossi",
    email: "cami@example.com",
    whatsapp: "+54 9 11 5555 2020",
    linkedin: "in/camirossi",
    titular: "Paid Media",
    descripcion:
      "Especialista en performance y adquisición. Google & Meta Ads para ecommerce.",
    roles: ["Paid Media", "Ecommerce"],
    rubros: ["Ecommerce", "Retail"],
    experiencia: "Semi Senior",
    honorarios: "$$$",
    modalidad: "Remoto",
    disponibilidad: "1-2 semanas",
    estado: "aprobado",
    destacado: false,
    createdAt: "2026-06-20T12:30:00Z",
  },
  {
    id: "p3",
    nombre: "Julián Méndez",
    email: "juli@example.com",
    instagram: "@juli.design",
    titular: "Diseñador & Branding",
    descripcion:
      "Identidad visual y sistemas de marca. Enfoque editorial y minimalista.",
    roles: ["Diseño", "Branding"],
    rubros: ["Gastronomía", "Retail"],
    experiencia: "Senior",
    honorarios: "$$$",
    modalidad: "Remoto",
    disponibilidad: "Inmediata",
    estado: "pendiente",
    destacado: false,
    createdAt: "2026-06-28T09:15:00Z",
  },
  {
    id: "p4",
    nombre: "Sofía Aguirre",
    email: "sofi@example.com",
    linkedin: "in/sofiaguirre",
    titular: "Community Manager",
    descripcion:
      "Gestión de comunidades y contenido orgánico. Salud y bienestar.",
    roles: ["Community Management", "Contenido"],
    rubros: ["Salud", "Educación"],
    experiencia: "Junior",
    honorarios: "$",
    modalidad: "Remoto",
    disponibilidad: "Inmediata",
    estado: "pendiente",
    destacado: false,
    createdAt: "2026-06-29T16:40:00Z",
  },
  {
    id: "p5",
    nombre: "Estudio Norte",
    email: "hola@estudionorte.example",
    portfolioUrl: "https://estudionorte.example",
    titular: "Agencia · Web & Ecommerce",
    descripcion:
      "Equipo full-stack para tiendas online: diseño, desarrollo y mantenimiento.",
    roles: ["Web", "Ecommerce", "Programación"],
    rubros: ["Ecommerce", "Tecnología"],
    experiencia: "Senior",
    honorarios: "$$$$",
    modalidad: "Híbrido",
    disponibilidad: "Más de 2 semanas",
    estado: "aprobado",
    destacado: true,
    createdAt: "2026-06-15T11:00:00Z",
  },
  {
    id: "p6",
    nombre: "Martín Paz",
    email: "martin@example.com",
    titular: "Automatización & No-code",
    descripcion:
      "Flujos de automatización, CRMs y operaciones. Make, n8n, integraciones.",
    roles: ["Automatización", "Programación"],
    rubros: ["Tecnología", "Industrial"],
    experiencia: "Semi Senior",
    honorarios: "$$",
    modalidad: "Remoto",
    disponibilidad: "1-2 semanas",
    estado: "rechazado",
    destacado: false,
    createdAt: "2026-06-22T14:20:00Z",
  },
];

export const companies: Company[] = [
  {
    id: "c1",
    nombre: "Jano's",
    contacto: "Lucía Jano",
    email: "lucia@janos.example",
    telefono: "+54 9 11 4444 1111",
    rubro: "Gastronomía",
    tamano: "11-50",
    origen: "Instagram",
    createdAt: "2026-06-25T10:00:00Z",
  },
  {
    id: "c2",
    nombre: "Deicon",
    contacto: "Pablo Deicon",
    email: "pablo@deicon.example",
    rubro: "Industrial",
    tamano: "51-200",
    origen: "Referido",
    createdAt: "2026-06-26T13:00:00Z",
  },
  {
    id: "c3",
    nombre: "María Cián",
    contacto: "María Cián",
    email: "hola@mariacian.example",
    rubro: "Retail",
    tamano: "1-10",
    origen: "Web",
    createdAt: "2026-06-30T09:30:00Z",
  },
  {
    id: "c4",
    nombre: "Wamclick",
    contacto: "Diego Ramos",
    email: "diego@wamclick.example",
    rubro: "Tecnología",
    tamano: "11-50",
    origen: "LinkedIn",
    createdAt: "2026-07-01T15:45:00Z",
  },
];

export const diagnoses: Diagnosis[] = [
  {
    id: "d1",
    companyId: "c1",
    rubro: "Gastronomía",
    facturacion: "USD 20k-50k / mes",
    objetivos: "Aumentar reservas y presencia en redes.",
    presupuesto: "$$",
    equipoActual: "Un CM part-time.",
    problemaPrincipal:
      "No saben si necesitan más contenido, pauta o un rediseño de marca.",
    estadoLead: "en_conversacion",
    notas: "Interesados en supervisión mensual.",
    createdAt: "2026-06-25T10:05:00Z",
  },
  {
    id: "d2",
    companyId: "c2",
    rubro: "Industrial",
    facturacion: "USD 100k+ / mes",
    objetivos: "Generar leads B2B y ordenar procesos comerciales.",
    presupuesto: "$$$$",
    equipoActual: "Equipo comercial sin soporte de marketing.",
    problemaPrincipal:
      "Necesitan automatización y contenido técnico, no 'más posteos'.",
    estadoLead: "propuesta_enviada",
    createdAt: "2026-06-26T13:10:00Z",
  },
  {
    id: "d3",
    companyId: "c3",
    rubro: "Retail",
    objetivos: "Lanzar tienda online.",
    presupuesto: "$$",
    problemaPrincipal: "No tienen ecommerce ni quién lo arme.",
    estadoLead: "nuevo",
    createdAt: "2026-06-30T09:35:00Z",
  },
  {
    id: "d4",
    companyId: "c4",
    rubro: "Tecnología",
    facturacion: "USD 50k-100k / mes",
    objetivos: "Escalar adquisición pagada.",
    presupuesto: "$$$",
    equipoActual: "Marketing in-house de 2 personas.",
    problemaPrincipal: "Estancados en performance, buscan un especialista senior.",
    estadoLead: "nuevo",
    createdAt: "2026-07-01T15:50:00Z",
  },
];

export const matchRequests: MatchRequest[] = [
  {
    id: "m1",
    companyId: "c1",
    diagnosisId: "d1",
    contexto: "Gastronomía · contenido + pauta, presupuesto medio.",
    candidatos: [
      { professionalId: "p4", puntaje: 82, seleccionado: true },
      { professionalId: "p2", puntaje: 74, seleccionado: false },
      { professionalId: "p1", puntaje: 69, seleccionado: false },
      { professionalId: "p3", puntaje: 61, seleccionado: false },
    ],
    estado: "en_gestion",
    createdAt: "2026-06-27T11:00:00Z",
  },
  {
    id: "m2",
    companyId: "c4",
    diagnosisId: "d4",
    contexto: "Tecnología · Paid Media senior, presupuesto alto.",
    candidatos: [
      { professionalId: "p2", puntaje: 91, seleccionado: false },
      { professionalId: "p5", puntaje: 68, seleccionado: false },
    ],
    estado: "solicitado",
    createdAt: "2026-07-01T16:00:00Z",
  },
  {
    id: "m3",
    companyId: "c3",
    diagnosisId: "d3",
    contexto: "Retail · armado de ecommerce.",
    candidatos: [
      { professionalId: "p5", puntaje: 88, seleccionado: true },
      { professionalId: "p6", puntaje: 55, seleccionado: false },
    ],
    estado: "cerrado",
    resultado: "Match concretado con Estudio Norte.",
    createdAt: "2026-06-30T10:00:00Z",
  },
];

// --- Usuarios de sesión (mock) ----------------------------------------------
// Tres cuentas de ejemplo para recorrer la plataforma con cada rol.

export const sessionUsers: SessionUser[] = [
  {
    id: "u-free",
    nombre: "Nicolás Ferraro",
    email: "nico@example.com",
    rol: "freelancer",
    professionalId: "p1",
  },
  {
    id: "u-emp",
    nombre: "Jano's",
    email: "lucia@janos.example",
    rol: "empresa",
    companyId: "c1",
  },
  {
    id: "u-admin",
    nombre: "Equipo Sinnergia",
    email: "admin@sinnergia.studio",
    rol: "admin",
  },
];

export function getSessionUser(id: string) {
  return sessionUsers.find((u) => u.id === id);
}

// --- Helpers -----------------------------------------------------------------

export function getProfessional(id: string) {
  return professionals.find((p) => p.id === id);
}

/** Todos los diagnósticos de una empresa. */
export function diagnosesByCompany(companyId: string) {
  return diagnoses.filter((d) => d.companyId === companyId);
}

/** Solicitudes de match de una empresa. */
export function matchesByCompany(companyId: string) {
  return matchRequests.filter((m) => m.companyId === companyId);
}

/** Matches donde un profesional figura como candidato (sus oportunidades). */
export function matchesForProfessional(professionalId: string) {
  return matchRequests
    .filter((m) => m.candidatos.some((c) => c.professionalId === professionalId))
    .map((m) => ({
      match: m,
      candidato: m.candidatos.find((c) => c.professionalId === professionalId)!,
    }));
}

export function getCompany(id: string) {
  return companies.find((c) => c.id === id);
}

export function getDiagnosis(id: string) {
  return diagnoses.find((d) => d.id === id);
}

export function getDiagnosisByCompany(companyId: string) {
  return diagnoses.find((d) => d.companyId === companyId);
}

/** Métricas del funnel para el dashboard. */
export function getDashboardStats() {
  return {
    profesionalesTotal: professionals.length,
    profesionalesPendientes: professionals.filter((p) => p.estado === "pendiente")
      .length,
    profesionalesAprobados: professionals.filter((p) => p.estado === "aprobado")
      .length,
    diagnosticosTotal: diagnoses.length,
    diagnosticosNuevos: diagnoses.filter((d) => d.estadoLead === "nuevo").length,
    matchesTotal: matchRequests.length,
    matchesEnGestion: matchRequests.filter(
      (m) => m.estado === "en_gestion" || m.estado === "solicitado"
    ).length,
    matchesCerrados: matchRequests.filter((m) => m.estado === "cerrado").length,
  };
}
