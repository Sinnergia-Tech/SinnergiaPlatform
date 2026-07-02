/**
 * Motor de matching de Sinnergia — scoring multi-criterio por reglas.
 *
 * Objetivo: dada una búsqueda de una empresa (query), rankear a los
 * profesionales por relevancia con un puntaje 0–100 EXPLICABLE (se sabe por qué
 * ganó cada uno). Es determinístico y transparente hoy; mañana la lógica de
 * puntaje puede reemplazarse por IA sin tocar el modelo de datos ni la UI.
 *
 * Diseño clave — "normalización por criterios aplicables":
 * sólo se ponderan los criterios que la empresa efectivamente especificó. Si no
 * pidió idiomas, ese factor no suma ni resta. Así el puntaje refleja qué tan
 * bien encaja el profesional con LO QUE PIDIÓ la empresa, y no lo castiga por
 * criterios que a la empresa no le importan. Esto es lo que hace que se sienta
 * "inteligente" en vez de un filtro rígido.
 */

export interface MatchableProfessional {
  id: string;
  nombre: string;
  titular: string;
  descripcion: string;
  roles: string[];
  rubros: string[];
  skills: string[];
  tecnologias: string[];
  idiomas: string[];
  experiencia: string; // seniority
  honorarios: string; // $..$$$$
  modalidad: string; // Remoto | Presencial | Híbrido
  disponibilidad: string;
  ubicacion?: string | null;
  estado: string;
  destacado: boolean;
  fotoUrl?: string | null;
}

export interface MatchQuery {
  roles?: string[];
  rubros?: string[];
  skills?: string[];
  tecnologias?: string[];
  idiomas?: string[];
  keywords?: string;
  experiencia?: string;
  modalidad?: string;
  presupuesto?: string; // $..$$$$
  ubicacion?: string;
}

export interface MatchFactor {
  clave: string;
  etiqueta: string;
  aporte: number; // puntos ganados
  max: number; // puntos posibles de este factor
  coincidencias?: string[]; // qué coincidió (para explicar)
}

export interface ScoredProfessional {
  professional: MatchableProfessional;
  score: number; // 0..100
  factores: MatchFactor[];
  razones: string[]; // top motivos legibles
}

// Pesos de cada criterio (sobre 100). Sólo cuentan los que la query especifica.
const WEIGHTS = {
  roles: 30,
  rubros: 16,
  skills: 14,
  tecnologias: 10,
  keywords: 8,
  experiencia: 8,
  modalidad: 6,
  idiomas: 4,
  presupuesto: 2,
  ubicacion: 2,
} as const;

const norm = (s: string) => s.trim().toLowerCase();

/** Cuánto de lo que pidió la empresa cubre el profesional (0..1) + coincidencias. */
function coverage(queryArr: string[], profArr: string[]) {
  const q = queryArr.map(norm);
  const p = new Set(profArr.map(norm));
  const hits = queryArr.filter((_, i) => p.has(q[i]));
  return { ratio: q.length ? hits.length / q.length : 0, hits };
}

const PRESUPUESTO_NIVEL: Record<string, number> = { $: 1, $$: 2, $$$: 3, $$$$: 4 };
const SENIORITY_NIVEL: Record<string, number> = {
  Junior: 1,
  "Semi Senior": 2,
  Senior: 3,
};

// Compatibilidad de modalidad: query -> profesional -> factor 0..1
const MODALIDAD_COMPAT: Record<string, Record<string, number>> = {
  Remoto: { Remoto: 1, Híbrido: 0.9, Presencial: 0.3 },
  Híbrido: { Híbrido: 1, Remoto: 0.7, Presencial: 0.6 },
  Presencial: { Presencial: 1, Híbrido: 0.7, Remoto: 0.2 },
};

export function scoreProfessional(
  professional: MatchableProfessional,
  query: MatchQuery
): ScoredProfessional {
  const factores: MatchFactor[] = [];
  let earned = 0;
  let applicableMax = 0;

  const addSet = (
    clave: keyof typeof WEIGHTS,
    etiqueta: string,
    q: string[] | undefined,
    prof: string[]
  ) => {
    if (!q || q.length === 0) return;
    const { ratio, hits } = coverage(q, prof);
    const max = WEIGHTS[clave];
    const aporte = ratio * max;
    applicableMax += max;
    earned += aporte;
    factores.push({ clave, etiqueta, aporte, max, coincidencias: hits });
  };

  addSet("roles", "Especialidad", query.roles, professional.roles);
  addSet("rubros", "Rubro / industria", query.rubros, professional.rubros);
  addSet("skills", "Skills", query.skills, professional.skills);
  addSet("tecnologias", "Tecnologías", query.tecnologias, professional.tecnologias);
  addSet("idiomas", "Idiomas", query.idiomas, professional.idiomas);

  // Keywords (texto libre) contra un índice de texto del perfil
  if (query.keywords && query.keywords.trim()) {
    const tokens = query.keywords
      .split(/[\s,]+/)
      .map(norm)
      .filter((t) => t.length > 2);
    if (tokens.length) {
      const haystack = norm(
        [
          professional.titular,
          professional.descripcion,
          professional.roles.join(" "),
          professional.rubros.join(" "),
          professional.skills.join(" "),
          professional.tecnologias.join(" "),
        ].join(" ")
      );
      const hits = tokens.filter((t) => haystack.includes(t));
      const max = WEIGHTS.keywords;
      const aporte = (hits.length / tokens.length) * max;
      applicableMax += max;
      earned += aporte;
      factores.push({ clave: "keywords", etiqueta: "Palabras clave", aporte, max, coincidencias: hits });
    }
  }

  // Experiencia / seniority (match exacto = 1, adyacente = 0.5)
  if (query.experiencia) {
    const qn = SENIORITY_NIVEL[query.experiencia] ?? 0;
    const pn = SENIORITY_NIVEL[professional.experiencia] ?? 0;
    const diff = Math.abs(qn - pn);
    const ratio = diff === 0 ? 1 : diff === 1 ? 0.5 : 0;
    const max = WEIGHTS.experiencia;
    applicableMax += max;
    earned += ratio * max;
    factores.push({ clave: "experiencia", etiqueta: "Seniority", aporte: ratio * max, max });
  }

  // Modalidad
  if (query.modalidad) {
    const ratio = MODALIDAD_COMPAT[query.modalidad]?.[professional.modalidad] ?? 0;
    const max = WEIGHTS.modalidad;
    applicableMax += max;
    earned += ratio * max;
    factores.push({ clave: "modalidad", etiqueta: "Modalidad", aporte: ratio * max, max });
  }

  // Presupuesto (encaja si los honorarios están dentro o por debajo)
  if (query.presupuesto) {
    const qn = PRESUPUESTO_NIVEL[query.presupuesto] ?? 4;
    const pn = PRESUPUESTO_NIVEL[professional.honorarios] ?? 4;
    const ratio = pn <= qn ? 1 : pn - qn === 1 ? 0.5 : 0;
    const max = WEIGHTS.presupuesto;
    applicableMax += max;
    earned += ratio * max;
    factores.push({ clave: "presupuesto", etiqueta: "Presupuesto", aporte: ratio * max, max });
  }

  // Ubicación (relevante para presencial / híbrido)
  if (query.ubicacion && query.ubicacion.trim()) {
    const match =
      professional.ubicacion &&
      norm(professional.ubicacion).includes(norm(query.ubicacion));
    const ratio = match ? 1 : 0;
    const max = WEIGHTS.ubicacion;
    applicableMax += max;
    earned += ratio * max;
    factores.push({ clave: "ubicacion", etiqueta: "Ubicación", aporte: ratio * max, max });
  }

  // Normalización: puntaje sobre los criterios que la empresa pidió
  let score = applicableMax > 0 ? (earned / applicableMax) * 100 : 50;

  // Bonificaciones suaves (nudge, no dominan)
  if (professional.destacado) score += 4;
  if (professional.disponibilidad === "Inmediata") score += 3;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Razones legibles (top factores con coincidencias)
  const razones = factores
    .filter((f) => f.coincidencias && f.coincidencias.length > 0)
    .sort((a, b) => b.aporte - a.aporte)
    .slice(0, 3)
    .map((f) => `${f.etiqueta}: ${f.coincidencias!.join(", ")}`);

  return { professional, score, factores, razones };
}

/**
 * Rankea profesionales aprobados por relevancia.
 * Devuelve los top-N destacados + el resto para "seguir explorando".
 */
export function rankProfessionals(
  professionals: MatchableProfessional[],
  query: MatchQuery,
  topN = 5
): { top: ScoredProfessional[]; resto: ScoredProfessional[] } {
  const scored = professionals
    .filter((p) => p.estado === "aprobado")
    .map((p) => scoreProfessional(p, query))
    .sort((a, b) => b.score - a.score);

  return { top: scored.slice(0, topN), resto: scored.slice(topN) };
}

/** Construye una query a partir de un profesional (para "perfiles similares"). */
export function queryFromProfessional(p: {
  roles: string[];
  rubros: string[];
  skills: string[];
}): MatchQuery {
  return { roles: p.roles, rubros: p.rubros, skills: p.skills };
}

/** Construye una query de match a partir de un diagnóstico de empresa. */
export function queryFromDiagnosis(diag: {
  rubro: string;
  presupuesto: string;
  objetivos?: string | null;
  problemaPrincipal?: string | null;
}): MatchQuery {
  return {
    rubros: diag.rubro ? [diag.rubro] : [],
    presupuesto: diag.presupuesto,
    keywords: [diag.objetivos ?? "", diag.problemaPrincipal ?? ""].join(" ").trim(),
  };
}
