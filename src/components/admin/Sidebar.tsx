"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";

const items = [
  { label: "Dashboard", href: "/admin" },
  { label: "Empresas", href: "/admin/empresas" },
  { label: "Profesionales", href: "/admin/profesionales" },
  { label: "Usuarios", href: "/admin/usuarios" },
  { label: "Contactos", href: "/admin/contactos" },
  { label: "Calendario", href: "/admin/calendario" },
  { label: "Reportes", href: "/admin/reportes" },
];

export function Sidebar({ badges = {} }: { badges?: Record<string, number> }) {
  const pathname = usePathname();

  const logout = () => {
    logoutAction();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink/10 bg-paper lg:flex">
      {/* Brand (link a la landing) */}
      <Link
        href="/"
        className="flex h-[68px] items-center gap-3 border-b border-ink/10 px-6 transition-colors hover:bg-smoke"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/isotipo-negro.png"
          alt="Sinnergia"
          className="h-7 w-7 object-contain"
        />
        <div className="leading-none">
          <div className="text-sm font-semibold uppercase tracking-[0.14em]">
            Sinnergia
          </div>
          <div className="mt-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-ink/40">
            Backoffice
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6">
        {items.map((it) => {
          const active =
            it.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(it.href);
          const count = badges[it.href] ?? 0;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`mb-1 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-ink text-paper"
                  : "text-ink/70 hover:bg-smoke hover:text-ink"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-paper" : "bg-ink/25"
                }`}
              />
              <span className="flex-1">{it.label}</span>
              {count > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-medium ${
                    active ? "bg-paper text-ink" : "bg-ink text-paper"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separador: abajo, la red compartida (misma vista que ven empresas y
            freelancers) — para inspeccionar la plataforma, no para operar. */}
        <div className="my-4 border-t border-ink/10" />
        <div className="mb-2 px-3 text-[0.65rem] uppercase tracking-[0.16em] text-ink/35">
          Plataforma
        </div>
        <Link
          href="/red"
          className="mb-1 flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-ink/70 transition-colors hover:bg-smoke hover:text-ink"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-ink/25" />
          <span className="flex-1">Red</span>
          <span className="text-ink/30">↗</span>
        </Link>
      </nav>

      {/* User */}
      <div className="border-t border-ink/10 p-4">
        <div className="flex items-center gap-3 rounded-sm px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center bg-ink text-xs font-semibold text-paper">
            SC
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">Sinnergia</div>
            <div className="text-xs text-ink/45">admin</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 block px-2 text-left text-xs text-ink/45 hover:text-ink"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

/** Barra superior mobile del backoffice (el sidebar se oculta en < lg). */
export function AdminMobileBar({ badges = {} }: { badges?: Record<string, number> }) {
  const dot = (href: string) =>
    (badges[href] ?? 0) > 0 ? (
      <span className="ml-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-ink align-super" />
    ) : null;
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink/10 bg-paper px-5 lg:hidden">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/isotipo-negro.png" alt="" className="h-6 w-6" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          Backoffice
        </span>
      </div>
      <nav className="flex gap-4 text-xs text-ink/60">
        <Link href="/admin">Panel</Link>
        <Link href="/admin/empresas">
          Emp.{dot("/admin/empresas")}
        </Link>
        <Link href="/admin/profesionales">Prof.</Link>
        <Link href="/admin/usuarios">Users</Link>
        <Link href="/admin/contactos">Cont.</Link>
        <Link href="/admin/calendario">Cal.</Link>
        <Link href="/admin/reportes">
          Rep.{dot("/admin/reportes")}
        </Link>
      </nav>
    </div>
  );
}
