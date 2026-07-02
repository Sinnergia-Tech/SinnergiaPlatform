"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readSession } from "@/lib/session";
import type { UserRole } from "@/lib/types";

/**
 * Protege una sección por rol. Si no hay sesión o el rol no coincide, redirige
 * a /login. Client-side (mock). En Fase 2 con auth real esto se refuerza en el
 * servidor (middleware / verificación de sesión).
 */
export function AuthGuard({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const u = readSession();
    const roles = Array.isArray(role) ? role : [role];
    if (!u || !roles.includes(u.rol)) {
      router.replace("/login");
      return;
    }
    setOk(true);
  }, [role, router]);

  if (!ok) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink/40">
        Verificando acceso…
      </div>
    );
  }

  return <>{children}</>;
}
