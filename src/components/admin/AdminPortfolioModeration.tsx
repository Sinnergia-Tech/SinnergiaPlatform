"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/admin/ui";
import { PortfolioProjects, type PortfolioProject } from "@/components/directory/PortfolioProjects";
import { ClickableImage } from "@/components/ui/ImageLightbox";
import { useToast } from "@/components/ui/Toast";
import {
  adminDeletePortfolioItemAction,
  adminRemovePortfolioImageAction,
} from "@/lib/actions";

export function AdminPortfolioModeration({
  professionalId,
  descripcion,
  imagenes,
  items,
}: {
  professionalId: string;
  descripcion: string | null;
  imagenes: string[];
  items: PortfolioProject[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const removeItem = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const res = await adminDeletePortfolioItemAction(id);
      if (res.ok) {
        toast.success("Proyecto eliminado.");
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo eliminar el proyecto.");
      }
      setDeletingId(null);
    });
  };

  const removeImage = (url: string) => {
    startTransition(async () => {
      const res = await adminRemovePortfolioImageAction(professionalId, url);
      if (res.ok) {
        toast.success("Imagen quitada.");
        router.refresh();
      } else {
        toast.error(res.error ?? "No se pudo quitar la imagen.");
      }
    });
  };

  const empty = !descripcion && imagenes.length === 0 && items.length === 0;

  return (
    <Card className="p-6">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
        Portfolio del perfil
      </h2>
      <p className="mt-1 text-xs text-ink/45">
        Moderá contenido puntual sin ocultar todo el perfil.
      </p>

      {empty ? (
        <p className="mt-5 text-sm text-ink/45">Este perfil no cargó portfolio.</p>
      ) : (
        <div className="mt-6 space-y-8">
          {descripcion && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.08em] text-ink/40">Descripción</p>
              <p className="whitespace-pre-line text-sm text-ink/75">{descripcion}</p>
            </div>
          )}

          {imagenes.length > 0 && (
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.08em] text-ink/40">Galería</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {imagenes.map((url) => (
                  <div
                    key={url}
                    className="group relative aspect-square overflow-hidden border border-ink/12 bg-smoke"
                  >
                    <ClickableImage src={url} className="h-full w-full" />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeImage(url)}
                      className="absolute right-1.5 top-1.5 z-10 bg-ink/75 px-2 py-1 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.08em] text-ink/40">Proyectos</p>
              <PortfolioProjects items={items} onDelete={removeItem} deletingId={deletingId} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
