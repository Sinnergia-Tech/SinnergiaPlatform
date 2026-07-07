"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkOriginalImage } from "@/lib/image-constraints";
import { compressImage } from "@/lib/image-compress";

type UploadResult = { ok: boolean; error?: string; url?: string };

export function PhotoUploadField({
  currentUrl,
  name,
  uploadAction,
  shape = "circle",
  size = "md",
}: {
  currentUrl: string | null;
  name: string;
  uploadAction: (formData: FormData) => Promise<UploadResult>;
  shape?: "circle" | "square";
  size?: "md" | "lg";
}) {
  const sizeCls = size === "lg" ? "h-40 w-40" : "h-20 w-20";
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = checkOriginalImage(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    setPending(true);

    // Comprimimos/redimensionamos en el navegador (los avatares no necesitan más de ~640px).
    const optimized = await compressImage(file, { maxDim: 640 });
    const formData = new FormData();
    formData.append("file", optimized);
    const res = await uploadAction(formData);
    setPending(false);

    if (res.ok && res.url) {
      setPreview(res.url);
      router.refresh();
    } else {
      setPreview(currentUrl);
      setError(res.error ?? "No se pudo subir la imagen.");
    }
  };

  const rounded = shape === "circle" ? "rounded-full" : "";

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        aria-label="Cambiar foto"
        className={`group relative ${sizeCls} shrink-0 cursor-pointer overflow-hidden border border-ink/15 bg-smoke ${rounded} disabled:cursor-wait`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[0.6rem] uppercase tracking-[0.08em] text-ink/35">
            Sin foto
          </span>
        )}
        {/* Overlay: aparece al hover (o fijo mientras sube). */}
        <span
          className={`absolute inset-0 flex items-center justify-center bg-ink/55 text-center text-[0.62rem] font-medium uppercase tracking-[0.1em] text-paper transition-opacity ${rounded} ${
            pending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {pending ? "Subiendo…" : preview ? "Cambiar foto" : "Subir foto"}
        </span>
      </button>

      {error && <p className="text-xs text-red-500">⚠ {error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
