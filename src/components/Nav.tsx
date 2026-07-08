"use client";

import { useEffect, useState } from "react";
import { Container } from "./ui/Container";

export function Nav({
  account,
  showDiagnostico = true,
  role,
}: {
  account?: { nombre: string; href: string } | null;
  showDiagnostico?: boolean;
  role?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // CTA principal: un admin va al dashboard; el resto (que corresponda) al
  // formulario de diagnóstico.
  const cta =
    role === "admin"
      ? { label: "Dashboard", href: "/admin" }
      : showDiagnostico
        ? { label: "Solicitar diagnóstico", href: "/diagnostico" }
        : null;

  // "Red" requiere cuenta — no tiene sentido mostrarlo a un visitante sin
  // sesión (hoy redirige a /login). Si vuelve logueado, aparece.
  const links = [
    { label: "Problema", href: "#problema" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Servicios", href: "#servicios" },
    ...(account ? [{ label: "Red", href: "/red" }] : []),
    { label: "Portfolio", href: "#portfolio" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        dark
          ? "bg-paper/95 backdrop-blur border-b border-ink/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <Container className="flex h-[72px] items-center justify-between">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-3" aria-label="Sinnergia Studio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dark ? "/brand/isotipo-negro.png" : "/brand/isotipo-blanco.png"}
            alt="Sinnergia Studio"
            className="h-8 w-8 object-contain transition-all duration-500"
          />
          <span
            className={`text-sm font-semibold uppercase tracking-[0.18em] transition-colors duration-500 ${
              dark ? "text-ink" : "text-paper"
            }`}
          >
            Sinnergia<span className="font-light">Studio</span>
          </span>
        </a>

        {/* Desktop links */}
        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`link-underline text-sm transition-colors duration-500 ${
                dark ? "text-ink/80 hover:text-ink" : "text-paper/85 hover:text-paper"
              }`}
            >
              {l.label}
            </a>
          ))}

          {/* Separador entre las secciones de la landing y los accesos a la plataforma */}
          <span
            aria-hidden
            className={`h-4 w-px transition-colors duration-500 ${
              dark ? "bg-ink/20" : "bg-paper/30"
            }`}
          />

          {account ? (
            <a
              href={account.href}
              className={`link-underline text-sm transition-colors duration-500 ${
                dark ? "text-ink/80 hover:text-ink" : "text-paper/85 hover:text-paper"
              }`}
            >
              Mi panel
            </a>
          ) : (
            <a
              href="/login"
              className={`link-underline text-sm transition-colors duration-500 ${
                dark ? "text-ink/80 hover:text-ink" : "text-paper/85 hover:text-paper"
              }`}
            >
              Ingresar
            </a>
          )}
          {cta && (
            <a
              href={cta.href}
              className={`px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] transition-all duration-300 ${
                dark
                  ? "bg-ink text-paper hover:bg-ink/85"
                  : "bg-paper text-ink hover:bg-paper/85"
              }`}
            >
              {cta.label}
            </a>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center lg:hidden"
          aria-label="Menú"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-px w-6 transition-all ${dark ? "bg-ink" : "bg-paper"} ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-6 transition-all ${dark ? "bg-ink" : "bg-paper"} ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-px w-6 transition-all ${dark ? "bg-ink" : "bg-paper"} ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </Container>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-ink/10 bg-paper lg:hidden">
          <Container className="flex flex-col py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink/5 py-3 text-sm text-ink/80"
              >
                {l.label}
              </a>
            ))}
            {account ? (
              <a
                href={account.href}
                onClick={() => setOpen(false)}
                className="border-b border-ink/5 py-3 text-sm text-ink/80"
              >
                Mi panel
              </a>
            ) : (
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="border-b border-ink/5 py-3 text-sm text-ink/80"
              >
                Ingresar
              </a>
            )}
            {cta && (
              <a
                href={cta.href}
                onClick={() => setOpen(false)}
                className="mt-4 bg-ink px-5 py-3 text-center text-xs font-medium uppercase tracking-[0.14em] text-paper"
              >
                {cta.label}
              </a>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}
