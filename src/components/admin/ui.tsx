import { ReactNode } from "react";

// --- Badge de estado (monocromático) ----------------------------------------

type BadgeVariant = "solid" | "outline" | "muted";

const badgeStyles: Record<BadgeVariant, string> = {
  solid: "bg-ink text-paper border-ink",
  outline: "bg-transparent text-ink border-ink/40",
  muted: "bg-smoke text-ink/45 border-transparent",
};

/** Mapea estados del dominio a una variante visual (sin usar color). */
export function estadoVariant(estado: string): BadgeVariant {
  if (["aprobado", "cerrado_ganado", "cerrado"].includes(estado)) return "solid";
  if (["rechazado", "oculto", "descartado", "cerrado_perdido"].includes(estado))
    return "muted";
  return "outline"; // pendiente, nuevo, solicitado, en_gestion, etc.
}

export function Badge({
  children,
  variant = "outline",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.06em] ${badgeStyles[variant]}`}
    >
      {children}
    </span>
  );
}

// --- Tarjeta de métrica ------------------------------------------------------

export function StatCard({
  value,
  label,
  sub,
}: {
  value: ReactNode;
  label: string;
  sub?: string;
}) {
  return (
    <div className="border border-ink/10 bg-paper p-6">
      <div className="text-4xl font-light tracking-[-0.02em]">{value}</div>
      <div className="mt-2 text-sm font-medium">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-ink/45">{sub}</div>}
    </div>
  );
}

// --- Encabezado de página del backoffice ------------------------------------

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/50">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// --- Card contenedora --------------------------------------------------------

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-ink/10 bg-paper ${className}`}>{children}</div>
  );
}
