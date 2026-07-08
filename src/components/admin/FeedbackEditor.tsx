"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader, Badge } from "@/components/admin/ui";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useToast } from "@/components/ui/Toast";
import { FEEDBACK_CATEGORIAS } from "@/lib/types";
import { FEEDBACK_ACCEPT, checkFeedbackFile, formatFileSize } from "@/lib/feedback-files";
import {
  createFeedbackAction,
  updateFeedbackAction,
  publishFeedbackAction,
  deleteFeedbackAction,
  uploadFeedbackAttachmentAction,
  deleteFeedbackAttachmentAction,
} from "@/lib/actions";

type Att = { id: string; fileName: string; size: number; mimeType: string };
type Initial = {
  id: string;
  title: string;
  descriptionMd: string;
  score: number | null;
  fortalezasMd: string | null;
  mejorasMd: string | null;
  categoria: string | null;
  status: "draft" | "published";
  attachments: Att[];
} | null;

const input =
  "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink";
const label = "mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-ink/45";
const card = "border border-ink/10 bg-paper p-6";

export function FeedbackEditor({
  companyId,
  companyNombre,
  diagnosisId,
  initial,
}: {
  companyId: string;
  companyNombre: string;
  diagnosisId: string | null;
  initial: Initial;
}) {
  const router = useRouter();
  const toast = useToast();
  const published = initial?.status === "published";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [categoria, setCategoria] = useState(initial?.categoria ?? "");
  const [score, setScore] = useState<number | null>(initial?.score ?? null);
  const [descripcion, setDescripcion] = useState(initial?.descriptionMd ?? "");
  const [fortalezas, setFortalezas] = useState(initial?.fortalezasMd ?? "");
  const [mejoras, setMejoras] = useState(initial?.mejorasMd ?? "");
  const [attachments, setAttachments] = useState<Att[]>(initial?.attachments ?? []);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState<"publish" | "delete" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const backHref = `/admin/empresas/${companyId}`;
  const payload = () => ({
    title,
    descriptionMd: descripcion,
    score,
    fortalezasMd: fortalezas,
    mejorasMd: mejoras,
    categoria,
  });

  const save = async () => {
    if (!title.trim()) return toast.error("El título es obligatorio.");
    setPending(true);
    if (initial) {
      const res = await updateFeedbackAction(initial.id, payload());
      setPending(false);
      if (res.ok) toast.success("Borrador guardado.");
      else toast.error(res.error);
    } else {
      const res = await createFeedbackAction({ companyId, diagnosisId: diagnosisId ?? undefined, ...payload() });
      setPending(false);
      if (res.ok) {
        toast.success("Borrador creado. Ya podés adjuntar archivos.");
        router.replace(`/admin/empresas/${companyId}/devoluciones/${res.id}`);
      } else {
        toast.error(res.error);
      }
    }
  };

  const publish = async () => {
    if (!initial) return;
    setPending(true);
    const res = await publishFeedbackAction(initial.id);
    setPending(false);
    setConfirm(null);
    if (res.ok) {
      toast.success("Devolución publicada. Se notificó a la empresa por email.");
      router.push(backHref);
    } else {
      toast.error(res.error);
    }
  };

  const remove = async () => {
    if (!initial) return router.push(backHref);
    setPending(true);
    const res = await deleteFeedbackAction(initial.id);
    setPending(false);
    setConfirm(null);
    if (res.ok) {
      toast.success("Devolución eliminada.");
      router.push(backHref);
    } else {
      toast.error(res.error);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !initial) return;
    const err = checkFeedbackFile(file);
    if (err) return toast.error(err);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadFeedbackAttachmentAction(initial.id, fd);
    setUploading(false);
    if (res.ok) {
      setAttachments((a) => [...a, res.attachment]);
      toast.success("Archivo adjuntado.");
    } else {
      toast.error(res.error);
    }
  };

  const removeAttachment = async (id: string) => {
    const res = await deleteFeedbackAttachmentAction(id);
    if (res.ok) setAttachments((a) => a.filter((x) => x.id !== id));
    else toast.error(res.error);
  };

  return (
    <>
      <Link href={backHref} className="mb-4 inline-block text-sm text-ink/50 hover:text-ink">
        ← {companyNombre}
      </Link>
      <AdminPageHeader
        title={initial ? (published ? "Devolución" : "Editar devolución") : "Nueva devolución"}
        subtitle={`Para ${companyNombre}`}
        actions={published ? <Badge variant="solid">Publicada</Badge> : <Badge variant="outline">Borrador</Badge>}
      />

      {published && (
        <div className="mb-4 border border-ink/40 bg-paper px-5 py-3 text-sm text-ink/70">
          Esta devolución ya está publicada — es de solo lectura. La empresa ya puede verla.
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-4">
        {/* Contenido */}
        <div className={`${card} space-y-5`}>
          <div>
            <label className={label}>Título</label>
            <input
              value={title}
              disabled={published}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Devolución de la primera sesión"
              className={input}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Categoría</label>
              <select
                value={categoria}
                disabled={published}
                onChange={(e) => setCategoria(e.target.value)}
                className={input}
              >
                <option value="">Sin categoría</option>
                {FEEDBACK_CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Puntaje general</label>
              <div className="flex items-center gap-2 py-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={published}
                    onClick={() => setScore(score === n ? null : n)}
                    className={`text-xl leading-none transition-colors disabled:cursor-default ${
                      score !== null && n <= score ? "text-ink" : "text-ink/25 hover:text-ink/50"
                    }`}
                    aria-label={`${n} de 5`}
                  >
                    {score !== null && n <= score ? "★" : "☆"}
                  </button>
                ))}
                {score !== null && !published && (
                  <button type="button" onClick={() => setScore(null)} className="ml-1 text-xs text-ink/40 hover:text-ink">
                    limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className={label}>Descripción</label>
            <MarkdownEditor
              value={descripcion}
              onChange={setDescripcion}
              disabled={published}
              placeholder="Escribí la devolución. Usá los botones de arriba para dar formato."
              minHeight={200}
            />
          </div>

          <div>
            <label className={label}>Fortalezas (opcional)</label>
            <MarkdownEditor
              value={fortalezas}
              onChange={setFortalezas}
              disabled={published}
              placeholder="Puntos fuertes detectados…"
              minHeight={110}
            />
          </div>

          <div>
            <label className={label}>Oportunidades de mejora (opcional)</label>
            <MarkdownEditor
              value={mejoras}
              onChange={setMejoras}
              disabled={published}
              placeholder="Aspectos a mejorar…"
              minHeight={110}
            />
          </div>
        </div>

        {/* Adjuntos (abajo de todo) */}
        <div className={card}>
          <h2 className={`${label} mb-3`}>Adjuntos</h2>
          {!initial ? (
            <p className="text-sm text-ink/45">Guardá el borrador para poder adjuntar archivos.</p>
          ) : (
            <>
              {attachments.length === 0 && <p className="mb-3 text-sm text-ink/45">Todavía no hay archivos.</p>}
              <ul className="mb-3 space-y-2">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 border border-ink/10 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate" title={a.fileName}>
                      {a.fileName}
                      <span className="ml-1 text-xs text-ink/40">{formatFileSize(a.size)}</span>
                    </span>
                    {!published && (
                      <button type="button" onClick={() => removeAttachment(a.id)} className="shrink-0 text-xs text-ink/45 hover:text-ink">
                        Quitar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {!published && (
                <>
                  <input ref={fileInput} type="file" accept={FEEDBACK_ACCEPT} className="hidden" onChange={onFile} />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                    className="w-full border border-dashed border-ink/25 px-4 py-3 text-xs uppercase tracking-[0.08em] text-ink/50 transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
                  >
                    {uploading ? "Subiendo…" : "+ Agregar archivo"}
                  </button>
                  <p className="mt-2 text-[0.7rem] text-ink/40">PDF, DOC/DOCX, XLS/XLSX, TXT o imágenes. Hasta 10 MB.</p>
                </>
              )}
            </>
          )}
        </div>

        {/* Acciones */}
        <div className={card}>
          {published ? (
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={backHref}
                className="bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.1em] text-paper hover:bg-ink/85"
              >
                Volver
              </Link>
              {confirm === "delete" ? (
                <span className="text-sm text-ink/60">
                  ¿Eliminar? La empresa dejará de verla.{" "}
                  <button onClick={remove} disabled={pending} className="font-medium text-ink underline-offset-4 hover:underline">
                    Sí
                  </button>{" "}
                  <button onClick={() => setConfirm(null)} className="text-ink/45 hover:text-ink">
                    No
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirm("delete")} className="text-xs text-ink/45 hover:text-ink">
                  Eliminar
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={save}
                disabled={pending}
                className="border border-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
              >
                {pending ? "Guardando…" : initial ? "Guardar borrador" : "Crear borrador"}
              </button>

              {initial &&
                (confirm === "publish" ? (
                  <span className="text-sm text-ink/60">
                    Se publica y se le avisa por email (no se podrá editar).{" "}
                    <button onClick={publish} disabled={pending} className="font-medium text-ink underline-offset-4 hover:underline">
                      Publicar
                    </button>{" "}
                    <button onClick={() => setConfirm(null)} className="text-ink/45 hover:text-ink">
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirm("publish")}
                    disabled={pending}
                    className="bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
                  >
                    Publicar
                  </button>
                ))}

              {initial && confirm !== "publish" && (
                <span className="ml-auto">
                  {confirm === "delete" ? (
                    <span className="text-sm text-ink/60">
                      ¿Eliminar el borrador?{" "}
                      <button onClick={remove} disabled={pending} className="font-medium text-ink underline-offset-4 hover:underline">
                        Sí
                      </button>{" "}
                      <button onClick={() => setConfirm(null)} className="text-ink/45 hover:text-ink">
                        No
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirm("delete")} className="text-xs text-ink/45 hover:text-ink">
                      Eliminar borrador
                    </button>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
