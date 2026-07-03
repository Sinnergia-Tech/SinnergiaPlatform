"use client";

import { useSearchParams } from "next/navigation";

export function LoginResetBanner() {
  const params = useSearchParams();
  if (params.get("reset") !== "1") return null;
  return (
    <p className="mb-4 text-center text-sm text-paper/70">
      Tu contraseña se actualizó. Ya podés iniciar sesión.
    </p>
  );
}
