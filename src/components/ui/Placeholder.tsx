type Tone = "light" | "dark";

/**
 * Placeholder visual para imágenes/videos.
 * Se reemplaza más adelante por el asset real (foto, render, video).
 */
export function Placeholder({
  label = "Imagen",
  ratio = "4 / 3",
  tone = "light",
  className = "",
}: {
  label?: string;
  ratio?: string;
  tone?: Tone;
  className?: string;
}) {
  const isDark = tone === "dark";
  return (
    <div
      style={{ aspectRatio: ratio }}
      className={`relative flex w-full items-center justify-center overflow-hidden border ${
        isDark
          ? "border-white/20 bg-white/[0.04]"
          : "border-ink/15 bg-smoke"
      } ${className}`}
    >
      {/* Cruz diagonal sutil típica de placeholder */}
      <svg
        className={`absolute inset-0 h-full w-full ${
          isDark ? "text-white/10" : "text-ink/[0.06]"
        }`}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <span
        className={`kicker relative z-10 ${
          isDark ? "text-white/40" : "text-ink/35"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
