"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UploadResult = { ok: boolean; error?: string; url?: string };

export function PhotoUploadField({
  currentUrl,
  name,
  uploadAction,
  shape = "circle",
}: {
  currentUrl: string | null;
  name: string;
  uploadAction: (formData: FormData) => Promise<UploadResult>;
  shape?: "circle" | "square";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setPending(true);

    const formData = new FormData();
    formData.append("file", file);
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

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-ink/15 bg-smoke ${
          shape === "circle" ? "rounded-full" : ""
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[0.6rem] uppercase tracking-[0.08em] text-ink/35">Sin foto</span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="border border-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
        >
          {pending ? "Subiendo…" : "Cambiar foto"}
        </button>
        <p className="mt-1.5 text-xs text-ink/40">JPG, PNG o WEBP. Máx 4MB.</p>
        {error && <p className="mt-1 text-xs text-red-500">⚠ {error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
