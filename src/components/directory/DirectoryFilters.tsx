"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ROLES,
  RUBROS,
  MODALIDADES,
  EXPERIENCIAS,
  PRESUPUESTOS,
} from "@/lib/catalogs";

export function DirectoryFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const get = (k: string) => params.get(k) ?? "";
  const getMulti = (k: string) =>
    get(k) ? get(k).split(",").filter(Boolean) : [];

  const [q, setQ] = useState(get("q"));

  const push = useCallback(
    (next: URLSearchParams) => {
      const s = next.toString();
      router.replace(s ? `/red?${s}` : "/red", { scroll: false });
    },
    [router]
  );

  // Debounce de la búsqueda por texto
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      if (next.toString() !== params.toString()) push(next);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggleMulti = (key: string, value: string) => {
    const cur = getMulti(key);
    const nextVals = cur.includes(value)
      ? cur.filter((v) => v !== value)
      : [...cur, value];
    const next = new URLSearchParams(params.toString());
    if (nextVals.length) next.set(key, nextVals.join(","));
    else next.delete(key);
    push(next);
  };

  const toggleSingle = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (get(key) === value) next.delete(key);
    else next.set(key, value);
    push(next);
  };

  const clearAll = () => {
    setQ("");
    router.replace("/red", { scroll: false });
  };

  const hasFilters = ["q", "rol", "rubro", "modalidad", "exp", "pre"].some((k) =>
    get(k)
  );

  return (
    <div className="border border-ink/12 bg-paper p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-ink">
          ¿Qué necesitás?
        </p>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-ink/45 hover:text-ink"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por palabra clave (ej. ecommerce, motion, ads…)"
        className="mt-4 w-full border border-ink/20 bg-paper px-4 py-3 text-sm outline-none focus:border-ink"
      />

      <ChipGroup label="Especialidad" options={ROLES} selected={getMulti("rol")} onToggle={(v) => toggleMulti("rol", v)} />
      <ChipGroup label="Rubro" options={RUBROS} selected={getMulti("rubro")} onToggle={(v) => toggleMulti("rubro", v)} />
      <ChipGroup label="Modalidad" options={MODALIDADES} selected={get("modalidad") ? [get("modalidad")] : []} onToggle={(v) => toggleSingle("modalidad", v)} />
      <ChipGroup label="Seniority" options={EXPERIENCIAS} selected={get("exp") ? [get("exp")] : []} onToggle={(v) => toggleSingle("exp", v)} />
      <ChipGroup label="Presupuesto" options={PRESUPUESTOS} selected={get("pre") ? [get("pre")] : []} onToggle={(v) => toggleSingle("pre", v)} />
    </div>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs uppercase tracking-[0.1em] text-ink/40">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/20 text-ink/70 hover:border-ink"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
