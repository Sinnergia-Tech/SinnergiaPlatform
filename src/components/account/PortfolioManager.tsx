"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addPortfolioItemAction,
  deletePortfolioItemAction,
  savePortfolioAction,
  updatePortfolioItemAction,
  uploadPortfolioImageAction,
} from "@/lib/actions";
import { PORTFOLIO_LIMITS as L } from "@/lib/portfolio-limits";
import { checkOriginalImage } from "@/lib/image-constraints";
import { compressImage } from "@/lib/image-compress";
import { ClickableImage } from "@/components/ui/ImageLightbox";
import { PortfolioProjects } from "@/components/directory/PortfolioProjects";
import { useToast } from "@/components/ui/Toast";

export type PortfolioItem = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
  enlace: string | null;
};

const inputClass =
  "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

async function uploadImage(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return uploadPortfolioImageAction(fd);
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={`text-xs ${value > max ? "text-red-500" : "text-ink/35"}`}>
      {value}/{max}
    </span>
  );
}

export function PortfolioManager({
  descripcion,
  imagenes,
  items,
}: {
  descripcion: string | null;
  imagenes: string[];
  items: PortfolioItem[];
}) {
  const router = useRouter();
  const toast = useToast();

  // --- Descripción general + galería ---
  const [desc, setDesc] = useState(descripcion ?? "");
  const [imgs, setImgs] = useState<string[]>(imagenes ?? []);
  const [savingDesc, setSavingDesc] = useState(false);
  const [descSaved, setDescSaved] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const persist = (nextDesc: string, nextImgs: string[]) =>
    savePortfolioAction({ descripcion: nextDesc, imagenes: nextImgs });

  const saveDesc = async () => {
    setSavingDesc(true);
    const res = await persist(desc, imgs);
    setSavingDesc(false);
    if (res.ok) {
      setDescSaved(true);
      toast.success("Descripción guardada");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo guardar la descripción.");
    }
  };

  const onGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = checkOriginalImage(file);
    if (invalid) {
      setGalleryError(invalid);
      return;
    }
    setGalleryError(null);
    setGalleryBusy(true);
    const optimized = await compressImage(file, { maxDim: 1600 });
    const up = await uploadImage(optimized);
    if (!up.ok || !up.url) {
      setGalleryBusy(false);
      setGalleryError(up.error ?? "No se pudo subir la imagen.");
      return;
    }
    const next = [...imgs, up.url].slice(0, L.imagenesMax);
    const res = await persist(desc, next);
    setGalleryBusy(false);
    if (res.ok) {
      setImgs(next);
      router.refresh();
    } else {
      setGalleryError(res.error ?? "No se pudo guardar.");
    }
  };

  const removeImg = async (url: string) => {
    const next = imgs.filter((u) => u !== url);
    setImgs(next);
    const res = await persist(desc, next);
    if (res.ok) router.refresh();
  };

  // --- Proyectos ---
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [enlace, setEnlace] = useState("");
  const [projImg, setProjImg] = useState<string | null>(null);
  const [projImgBusy, setProjImgBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const projInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const atMax = items.length >= L.proyectosMax;

  const onProjFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = checkOriginalImage(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setProjImgBusy(true);
    const optimized = await compressImage(file, { maxDim: 1600 });
    const up = await uploadImage(optimized);
    setProjImgBusy(false);
    if (up.ok && up.url) setProjImg(up.url);
    else setError(up.error ?? "No se pudo subir la imagen.");
  };

  const resetForm = () => {
    setEditingId(null);
    setTitulo("");
    setPDesc("");
    setEnlace("");
    setProjImg(null);
    setError(null);
  };

  const startEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setTitulo(item.titulo);
    setPDesc(item.descripcion);
    setEnlace(item.enlace ?? "");
    setProjImg(item.imagenUrl);
    setError(null);
    setShowForm(true);
    // Traer el formulario a la vista (queda arriba de la grilla).
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = editingId
      ? await updatePortfolioItemAction({
          id: editingId,
          titulo,
          descripcion: pDesc,
          imagenUrl: projImg,
          enlace: enlace || undefined,
        })
      : await addPortfolioItemAction({
          titulo,
          descripcion: pDesc,
          imagenUrl: projImg || undefined,
          enlace: enlace || undefined,
        });
    setPending(false);
    if (res.ok) {
      const wasEditing = editingId !== null;
      resetForm();
      setShowForm(false);
      toast.success(wasEditing ? "Proyecto actualizado" : "Proyecto agregado");
      router.refresh();
    } else {
      setError(res.error ?? "No se pudo guardar el proyecto.");
    }
  };

  const removeProject = async (id: string) => {
    setDeletingId(id);
    const res = await deletePortfolioItemAction(id);
    setDeletingId(null);
    if (res.ok) {
      toast.success("Proyecto eliminado");
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo eliminar el proyecto.");
    }
  };

  const projValid =
    titulo.trim().length > 0 &&
    titulo.length <= L.proyectoTitulo &&
    pDesc.trim().length > 0 &&
    pDesc.length <= L.proyectoDescripcion &&
    enlace.length <= L.enlace;

  return (
    <section className="border border-ink/10 bg-paper p-6">
      <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
        Tu portfolio
      </h2>

      {/* Descripción general */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium">Descripción general</label>
          <Counter value={desc.length} max={L.descripcion} />
        </div>
        <textarea
          value={desc}
          maxLength={L.descripcion}
          onChange={(e) => {
            setDesc(e.target.value);
            setDescSaved(false);
          }}
          placeholder="Contá de qué va tu trabajo, tu enfoque, en qué te especializás…"
          className={`${inputClass} min-h-[90px] resize-y`}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={saveDesc}
            disabled={savingDesc}
            className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
          >
            {savingDesc ? "Guardando…" : "Guardar descripción"}
          </button>
          {descSaved && <span className="text-xs text-ink/50">Guardado ✓</span>}
        </div>
      </div>

      {/* Galería (hasta 3 imágenes) */}
      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium">Imágenes del portfolio</label>
          <span className="text-xs text-ink/40">
            {imgs.length}/{L.imagenesMax}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {imgs.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden border border-ink/12 bg-smoke">
              <ClickableImage src={url} className="h-full w-full" />
              <button
                type="button"
                onClick={() => removeImg(url)}
                aria-label="Quitar imagen"
                className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center bg-ink/70 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
          {imgs.length < L.imagenesMax && (
            <button
              type="button"
              onClick={() => galleryInput.current?.click()}
              disabled={galleryBusy}
              className="flex aspect-square items-center justify-center border border-dashed border-ink/25 bg-smoke text-xs uppercase tracking-[0.08em] text-ink/45 transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
            >
              {galleryBusy ? "Subiendo…" : "+ Imagen"}
            </button>
          )}
        </div>
        {galleryError && <p className="mt-2 text-xs text-red-500">⚠ {galleryError}</p>}
        <input
          ref={galleryInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onGalleryFile}
        />
      </div>

      {/* Proyectos */}
      <div className="mt-8 border-t border-ink/10 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Proyectos</h3>
            <p className="mt-0.5 text-xs text-ink/45">
              {items.length}/{L.proyectosMax} · imagen, nombre, descripción y link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
                return;
              }
              if (atMax) return;
              resetForm();
              setShowForm(true);
            }}
            disabled={atMax && !showForm}
            className="border border-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showForm ? "Cancelar" : atMax ? "Máximo alcanzado" : "Agregar proyecto"}
          </button>
        </div>

        {showForm && (
          <form ref={formRef} onSubmit={submitProject} className="mb-6 space-y-3 border border-ink/10 bg-smoke p-4">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink/50">
              {editingId ? "Editar proyecto" : "Nuevo proyecto"}
            </p>
            {/* Imagen del proyecto */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => projInput.current?.click()}
                disabled={projImgBusy}
                className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-ink/15 bg-paper text-xs uppercase tracking-[0.06em] text-ink/40"
              >
                {projImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={projImg} alt="" className="h-full w-full object-cover" />
                ) : projImgBusy ? (
                  "Subiendo…"
                ) : (
                  "+ Imagen"
                )}
                {projImg && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[0.6rem] uppercase tracking-[0.1em] text-paper opacity-0 transition-opacity group-hover:opacity-100">
                    Cambiar
                  </span>
                )}
              </button>
              <p className="text-xs text-ink/40">Imagen del proyecto (opcional).</p>
            </div>
            <input
              ref={projInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onProjFile}
            />

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-ink/50">Nombre</span>
                <Counter value={titulo.length} max={L.proyectoTitulo} />
              </div>
              <input
                placeholder="Nombre del proyecto"
                required
                maxLength={L.proyectoTitulo}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-ink/50">Descripción</span>
                <Counter value={pDesc.length} max={L.proyectoDescripcion} />
              </div>
              <textarea
                placeholder="Descripción breve del proyecto"
                required
                maxLength={L.proyectoDescripcion}
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                className={`${inputClass} min-h-[70px] resize-y`}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-ink/50">Link (opcional)</span>
                <Counter value={enlace.length} max={L.enlace} />
              </div>
              <input
                placeholder="https://…"
                maxLength={L.enlace}
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && <p className="text-xs text-red-500">⚠ {error}</p>}
            <button
              type="submit"
              disabled={pending || !projValid}
              className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
            >
              {pending
                ? "Guardando…"
                : editingId
                  ? "Guardar cambios"
                  : "Guardar proyecto"}
            </button>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-ink/45">
            Todavía no cargaste ningún proyecto. Las empresas que vean tu perfil van a
            ver los proyectos que agregues acá.
          </p>
        ) : (
          <PortfolioProjects
            items={items}
            onDelete={removeProject}
            onEdit={startEdit}
            deletingId={deletingId}
          />
        )}
      </div>
    </section>
  );
}
