"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "./types";

/**
 * Sesión MOCK (Fase 2). Guarda el usuario actual en localStorage para poder
 * recorrer la plataforma con cada rol sin auth real.
 *
 * En la conexión con la BD esto se reemplaza por Auth.js (cookies httpOnly +
 * verificación de rol en el servidor). La interfaz (useSession/login/logout) se
 * mantiene parecida para que el cambio sea acotado.
 */

const KEY = "sinnergia_demo_session";

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function writeSession(user: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}

/** Ruta de destino según el rol del usuario. */
export function homeForRole(user: SessionUser): string {
  return user.rol === "admin" ? "/admin" : "/cuenta";
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readSession());
    setReady(true);
  }, []);

  return { user, ready, setUser };
}
