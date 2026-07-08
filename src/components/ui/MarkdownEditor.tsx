"use client";

import { useRef, useState } from "react";
import { Markdown } from "@/components/ui/Markdown";

/**
 * Editor de Markdown con barra de formato (negrita, itálica, título, lista, cita,
 * link) + vista previa. Los botones envuelven/prefijan la selección — el usuario
 * no necesita saber Markdown. Guarda Markdown como string.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 180,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const wrap = (before: string, after = before) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e) || "texto";
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  };

  const prefixLines = (prefix: string) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const nextNl = value.indexOf("\n", e);
    const lineEnd = nextNl === -1 ? value.length : nextNl;
    const block = value.slice(lineStart, lineEnd) || "texto";
    const newBlock = block
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n");
    onChange(value.slice(0, lineStart) + newBlock + value.slice(lineEnd));
    requestAnimationFrame(() => ta.focus());
  };

  const btn =
    "flex h-8 min-w-8 items-center justify-center border border-ink/15 px-2 text-xs text-ink/70 transition-colors hover:border-ink hover:text-ink";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        {!disabled && !preview ? (
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" onClick={() => wrap("**")} className={`${btn} font-bold`} title="Negrita">
              B
            </button>
            <button type="button" onClick={() => wrap("*")} className={`${btn} italic`} title="Itálica">
              I
            </button>
            <button type="button" onClick={() => prefixLines("## ")} className={btn} title="Título">
              H
            </button>
            <button type="button" onClick={() => prefixLines("- ")} className={btn} title="Lista">
              • Lista
            </button>
            <button type="button" onClick={() => prefixLines("> ")} className={btn} title="Cita">
              ❝
            </button>
            <button type="button" onClick={() => wrap("[", "](https://)")} className={btn} title="Link">
              🔗 Link
            </button>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="text-xs text-ink/50 hover:text-ink"
        >
          {preview ? "Editar" : "Vista previa"}
        </button>
      </div>

      {preview ? (
        <div className="border border-ink/15 bg-smoke/40 p-4" style={{ minHeight }}>
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <span className="text-sm text-ink/35">Nada para previsualizar.</span>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full resize-y border border-ink/20 bg-paper px-3 py-2.5 font-mono text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink"
        />
      )}
    </div>
  );
}
