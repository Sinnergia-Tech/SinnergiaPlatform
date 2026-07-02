import { ReactNode } from "react";

type Variant = "solid" | "outline";
type Tone = "onLight" | "onDark";

const styles: Record<Tone, Record<Variant, string>> = {
  onLight: {
    solid:
      "bg-ink text-paper border border-ink hover:bg-paper hover:text-ink",
    outline:
      "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper",
  },
  onDark: {
    solid:
      "bg-paper text-ink border border-paper hover:bg-transparent hover:text-paper",
    outline:
      "bg-transparent text-paper border border-paper hover:bg-paper hover:text-ink",
  },
};

export function Button({
  children,
  href = "#",
  variant = "solid",
  tone = "onLight",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  tone?: Tone;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium uppercase tracking-[0.12em] transition-all duration-300 ${styles[tone][variant]} ${className}`}
    >
      {children}
      <span className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </a>
  );
}
