"use client";

import { Container } from "../ui/Container";
import { logoutAction } from "@/lib/auth-actions";

const rolLabel: Record<string, string> = {
  freelancer: "Freelancer",
  empresa: "Empresa",
  admin: "Admin",
};

export function AccountTopbar({
  user,
}: {
  user: { nombre: string; rol: string };
}) {
  const logout = () => {
    logoutAction();
  };

  return (
    <header className="border-b border-ink/10 bg-paper">
      <Container className="flex h-[68px] items-center justify-between">
        <a href="/" className="flex items-center gap-3" aria-label="Sinnergia Studio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/isotipo-negro.png"
            alt="Sinnergia"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold uppercase tracking-[0.16em]">
            Sinnergia<span className="font-light">Studio</span>
          </span>
        </a>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-tight">{user.nombre}</div>
            <div className="text-[0.7rem] uppercase tracking-[0.14em] text-ink/40">
              {rolLabel[user.rol]}
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center bg-ink text-xs font-semibold text-paper">
            {user.nombre.slice(0, 2).toUpperCase()}
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
