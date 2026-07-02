"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Envuelve contenido y lo anima al entrar en viewport.
 *
 * Resiliencia: el contenido es visible por defecto (sin JS / SEO). Sólo cuando
 * este componente monta, marca <html> con `js-ready`, lo que activa el estado
 * inicial oculto vía CSS. Así, si el JS no corre, no queda contenido invisible.
 * Respeta prefers-reduced-motion (definido en globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("js-ready");

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal-item ${visible ? "is-visible" : ""} ${className}`}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
