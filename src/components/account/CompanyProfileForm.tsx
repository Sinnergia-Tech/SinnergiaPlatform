"use client";

import { useState } from "react";
import { updateCompanyProfileAction, uploadCompanyLogoAction } from "@/lib/actions";
import { PhotoUploadField } from "@/components/account/PhotoUploadField";

const inputClass =
  "w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

export function CompanyProfileForm({
  nombre,
  initial,
}: {
  nombre: string;
  initial: {
    descripcion: string | null;
    logoUrl: string | null;
    linkedin: string | null;
    instagram: string | null;
    ubicacion: string | null;
  };
}) {
  const [descripcion, setDescripcion] = useState(initial.descripcion ?? "");
  const [linkedin, setLinkedin] = useState(initial.linkedin ?? "");
  const [instagram, setInstagram] = useState(initial.instagram ?? "");
  const [ubicacion, setUbicacion] = useState(initial.ubicacion ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const res = await updateCompanyProfileAction({
      descripcion: descripcion || undefined,
      linkedin: linkedin || undefined,
      instagram: instagram || undefined,
      ubicacion: ubicacion || undefined,
    });
    setPending(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "No se pudo guardar.");
  };

  return (
    <section className="border border-ink/10 bg-paper p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-[0.12em] text-ink/50">
        Perfil de tu empresa
      </h2>
      <p className="mb-6 text-sm text-ink/45">
        Estos datos los va a poder ver el freelancer cuando lo contactes.
      </p>

      <div className="mb-6">
        <PhotoUploadField
          currentUrl={initial.logoUrl}
          name={nombre}
          uploadAction={uploadCompanyLogoAction}
          shape="square"
        />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <textarea
          placeholder="Descripción de la empresa"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className={`${inputClass} min-h-[90px] resize-y`}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Ubicación"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="LinkedIn"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="Instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-red-500">⚠ {error}</p>}
        {saved && <p className="text-xs text-ink/50">Guardado ✓</p>}

        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-5 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-paper transition-colors hover:bg-ink/85 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </section>
  );
}
