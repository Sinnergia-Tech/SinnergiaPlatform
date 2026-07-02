"use client";

import { ReactNode } from "react";

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-ink/40"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink/45">{hint}</span>}
    </label>
  );
}

const baseInput =
  "w-full border border-ink/20 bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`${baseInput} min-h-[110px] resize-y ${props.className ?? ""}`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccioná…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInput} appearance-none pr-10 ${
          value ? "text-ink" : "text-ink/40"
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="text-ink">
            {o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/40">
        ↓
      </span>
    </div>
  );
}

/** Selección única tipo chips. */
export function ChoiceChips({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-ink bg-ink text-paper"
                : "border-ink/20 text-ink/80 hover:border-ink"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Selección múltiple tipo chips. */
export function MultiChips({
  values,
  onChange,
  options,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  const toggle = (o: string) =>
    onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const active = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`border px-4 py-2 text-sm transition-colors ${
              active
                ? "border-ink bg-ink text-paper"
                : "border-ink/20 text-ink/80 hover:border-ink"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
