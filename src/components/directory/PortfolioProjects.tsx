"use client";

import { useEffect, useState } from "react";
import { normalizeExternalUrl } from "@/lib/url";

export type PortfolioProject = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
  enlace: string | null;
};

/**
 * Grilla de proyectos. Clickear una tarjeta abre un modal con la info completa
 * (imagen en buena calidad, título, descripción y link validado). Reutilizada
 * por la gestión (/cuenta, con Borrar) y el perfil público (solo lectura).
 */
export function PortfolioProjects({
  items,
  onDelete,
  onEdit,
  deletingId,
}: {
  items: PortfolioProject[];
  onDelete?: (id: string) => void;
  onEdit?: (item: PortfolioProject) => void;
  deletingId?: string | null;
}) {
  const [selected, setSelected] = useState<PortfolioProject | null>(null);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="relative overflow-hidden border border-ink/12">
            <button
              type="button"
              onClick={() => setSelected(item)}
              className="block w-full cursor-pointer text-left"
            >
              {item.imagenUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imagenUrl}
                  alt={item.titulo}
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="font-medium">{item.titulo}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-ink/60">{item.descripcion}</p>
                <div className="mt-2 text-right">
                  <span className="link-underline text-xs text-ink">Ver proyecto</span>
                </div>
              </div>
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                disabled={deletingId === item.id}
                className="absolute right-2 top-2 bg-paper/85 px-2 py-1 text-xs text-ink/50 hover:text-ink disabled:opacity-50"
              >
                {deletingId === item.id ? "Borrando…" : "Borrar"}
              </button>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <ProjectDetailModal
          project={selected}
          onClose={() => setSelected(null)}
          onEdit={
            onEdit
              ? () => {
                  const p = selected;
                  setSelected(null);
                  onEdit(p);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

function ProjectDetailModal({
  project,
  onClose,
  onEdit,
}: {
  project: PortfolioProject;
  onClose: () => void;
  onEdit?: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const href = normalizeExternalUrl(project.enlace);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center bg-paper/85 text-lg leading-none text-ink/60 hover:text-ink"
        >
          ✕
        </button>

        {project.imagenUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imagenUrl}
            alt={project.titulo}
            className="max-h-[55vh] w-full object-cover"
          />
        )}

        <div className="p-6">
          <h3 className="text-xl font-semibold">{project.titulo}</h3>
          <p className="mt-3 whitespace-pre-line text-ink/75">{project.descripcion}</p>
          {(onEdit || href) && (
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-block border border-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  Editar
                </button>
              )}
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block border border-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  Ver proyecto ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
