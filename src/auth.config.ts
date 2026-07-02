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
  session: { strategy: "jwt" },
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

      if (isAdmin) return user?.role === "admin";
      if (isCuenta) return !!user; // freelancer o empresa logueados
      return true;
    },
  },
  providers: [], // se completan en src/auth.ts
} satisfies NextAuthConfig;
