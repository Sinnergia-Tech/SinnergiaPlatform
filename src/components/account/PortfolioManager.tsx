"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPortfolioItemAction, deletePortfolioItemAction } from "@/lib/actions";

export type PortfolioItem = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
  enlace: string | null;
};

const inputClass =
  "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

export function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [enlace, setEnlace] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await addPortfolioItemAction({
      titulo,
      descripcion,
      imagenUrl: imagenUrl || undefined,
      enlace: enlace || undefined,
    });
    setPending(false);
    if (res.ok) {
      setTitulo("");
      setDescripcion("");
      setImagenUrl("");
      setEnlace("");
      setShowForm(false);
      router.refresh();
    } else {
      setError(res.error ?? "No se pudo agregar el ítem.");
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    await deletePortfolioItemAction(id);
    setDeletingId(null);
    router.refresh();
  };

  return (
    <section className="border border-ink/10 bg-paper p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
          Tu portfolio
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="border border-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {showForm ? "Cancelar" : "Agregar proyecto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 space-y-3 border border-ink/10 bg-smoke p-4">
          <input
            placeholder="Título del proyecto"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Descripción breve"
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={`${inputClass} min-h-[80px] resize-y`}
          />
          <input
            placeholder="URL de imagen (opcional)"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Link al proyecto (opcional)"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-xs text-red-500">⚠ {error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-ink/45">
          Todavía no cargaste ningún proyecto. Las empresas que vean tu perfil van a
          ver los proyectos que agregues acá.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="border border-ink/12 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{item.titulo}</h3>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={deletingId === item.id}
                  className="shrink-0 text-xs text-ink/40 hover:text-ink disabled:opacity-50"
                >
                  {deletingId === item.id ? "Borrando…" : "Borrar"}
                </button>
              </div>
              <p className="mt-1 text-sm text-ink/60">{item.descripcion}</p>
              {item.enlace && (
                <a
                  href={item.enlace}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline mt-2 inline-block text-xs text-ink"
                >
                  Ver proyecto →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
