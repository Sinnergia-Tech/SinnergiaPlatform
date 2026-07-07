/**
 * Límites del portfolio del freelancer. Compartidos por el front (contadores +
 * maxLength) y el server (validación en las actions), para no cargar campos
 * gigantes con cosas innecesarias.
 */
export const PORTFOLIO_LIMITS = {
  /** Descripción general de todo el portfolio. */
  descripcion: 600,
  /** Imágenes de galería del portfolio. */
  imagenesMax: 3,
  /** Cantidad máxima de proyectos. */
  proyectosMax: 12,
  /** Campos de cada proyecto. */
  proyectoTitulo: 60,
  proyectoDescripcion: 280,
  enlace: 300,
} as const;
