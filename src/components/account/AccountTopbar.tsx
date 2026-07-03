"use client";

import { Container } from "../ui/Container";
import { logoutAction } from "@/lib/auth-actions";

function initials(nombre: string) {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// Navegación de la plataforma (no anclas de marketing de la landing).
const links = [
  { label: "Mi cuenta", href: "/cuenta" },
  { label: "Red", href: "/red" },
  { label: "Mis contactos", href: "/cuenta/contactos" },
];

export function AccountTopbar({
  user,
  unreadContacts = 0,
}: {
  user: { nombre: string; rol: string };
  unreadContacts?: number;
}) {
  const logout = () => {
    logoutAction();
  };

  return (
    <header className="border-b border-ink/10 bg-paper">
      <Container className="flex h-[68px] items-center justify-between gap-6">
        <a href="/" className="flex shrink-0 items-center gap-3" aria-label="Sinnergia Studio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/isotipo-negro.png"
            alt="Sinnergia"
            className="h-7 w-7 object-contain"
          />
          <span className="hidden text-sm font-semibold uppercase tracking-[0.16em] sm:inline">
            Sinnergia<span className="font-light">Studio</span>
          </span>
        </a>

        {/* Navegación (igual que la landing) */}
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="link-underline relative text-sm text-ink/70 hover:text-ink"
            >
              {l.label}
              {l.href === "/cuenta/contactos" && unreadContacts > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.6rem] font-semibold text-paper">
                  {unreadContacts}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">{user.nombre}</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center bg-ink text-xs font-semibold text-paper">
            {initials(user.nombre)}
          </div>
          <button
            onClick={logout}
            className="border border-ink/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] transition-colors hover:border-ink"
          >
            Salir
          </button>
        </div>
      </Container>
    </header>
  );
}
