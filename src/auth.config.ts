import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/lib/types";

type DomainUser = {
  id?: string;
  role?: UserRole;
  professionalId?: string | null;
  companyId?: string | null;
};

/**
 * Config base de Auth.js — SIN acceso a base de datos (edge-safe).
 * La usa el middleware para proteger rutas leyendo el JWT.
 * El provider con Prisma se agrega en src/auth.ts (runtime Node).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Sesión JWT pura (sin adapter/DB): no hay revocación dura de sesiones
  // activas al resetear contraseña o desactivar una cuenta — expiran solas
  // a los 30 días. El middleware necesita quedar edge-safe (sin Prisma), así
  // que una revocación real requeriría migrar a sesiones en DB más adelante.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    // Persistir datos del usuario en el token al iniciar sesión
    jwt({ token, user }) {
      if (user) {
        const u = user as DomainUser;
        const t = token as Record<string, unknown>;
        t.id = u.id;
        t.role = u.role;
        t.professionalId = u.professionalId ?? null;
        t.companyId = u.companyId ?? null;
      }
      return token;
    },
    // Exponer esos datos en la sesión
    session({ session, token }) {
      const t = token as DomainUser;
      if (session.user) {
        session.user.id = t.id ?? "";
        session.user.role = (t.role ?? "empresa") as UserRole;
        session.user.professionalId = t.professionalId ?? null;
        session.user.companyId = t.companyId ?? null;
      }
      return session;
    },
    // Protección de rutas (corre en el middleware, edge)
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const path = nextUrl.pathname;

      const isAdmin = path.startsWith("/admin");
      const isCuenta = path.startsWith("/cuenta");
      const isRed = path.startsWith("/red");

      if (isAdmin) return user?.role === "admin";
      if (isCuenta) return !!user; // freelancer o empresa logueados
      if (isRed) return !!user; // cualquier rol logueado navega la red
      return true;
    },
  },
  providers: [], // se completan en src/auth.ts
} satisfies NextAuthConfig;
