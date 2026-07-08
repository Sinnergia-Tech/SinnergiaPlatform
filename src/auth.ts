import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { verifyPassword } from "@/lib/password";
import * as data from "@/lib/data";
import { signOnboardingToken } from "@/lib/google-onboarding";
import type { UserRole } from "@/lib/types";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Contraseña y email correctos, pero la cuenta todavía no confirmó su email. */
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

/** ¿Está configurado el login con Google? (sin credenciales, el proveedor no se agrega) */
export const isGoogleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;

      // Cuenta sin contraseña (entra sólo con Google): no puede usar este método.
      if (!user.passwordHash) return null;

      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return null;

      // Cuenta eliminada (soft-delete): no puede iniciar sesión.
      if (user.deletedAt) return null;

      if (!user.emailVerified) {
        throw new EmailNotVerifiedError();
      }

      // Registrar actividad: refresca la ventana de inactividad y limpia el
      // aviso pendiente. La deshabilitación MANUAL (disabledAt) NO se toca acá
      // —se reactiva con una acción explícita, no por loguear.
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), inactivityWarnedAt: null },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.nombre,
        role: user.role,
        professionalId: user.professionalId,
        companyId: user.companyId,
      };
    },
  }),
];

if (isGoogleConfigured) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Google devuelve identidad (email verificado, nombre, foto) pero NO rol ni
     * datos de perfil. Por eso acá sólo resolvemos usuarios que YA existen (match
     * por email): se vinculan y entran. Un email nuevo se manda a crear cuenta
     * (el alta vía Google —elegir freelancer/empresa y completar datos— es el
     * próximo paso). El login por contraseña (provider "credentials") pasa igual.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;
      // Exigir email verificado por Google.
      const emailVerified = (profile as { email_verified?: boolean } | undefined)
        ?.email_verified;
      if (emailVerified === false) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        // Usuario nuevo: no creamos nada todavía (falta rol + datos). Firmamos la
        // identidad de Google y lo mandamos a completar el registro. Devolver un
        // string acá redirige SIN crear sesión.
        const token = signOnboardingToken({
          email,
          name: user.name ?? "",
          image: user.image ?? null,
          sub: account.providerAccountId ?? "",
        });
        return `/completar-registro?t=${encodeURIComponent(token)}`;
      }
      if (existing.deletedAt) return false;

      await data.linkGoogleAccount({
        userId: existing.id,
        googleId: existing.googleId ? null : account.providerAccountId,
        image: existing.image ? null : user.image ?? null,
        markVerified: !existing.emailVerified,
      });
      return true;
    },
    /**
     * En login con Google, `user` es el perfil OAuth (sin rol). Cargamos los datos
     * de dominio desde la DB por email y los metemos en el token. Para credentials,
     * `user` ya trae los campos (los puso `authorize`).
     */
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const db = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (db) {
          token.id = db.id;
          token.role = db.role as UserRole;
          token.professionalId = db.professionalId ?? null;
          token.companyId = db.companyId ?? null;
          token.name = db.nombre;
        }
        return token;
      }
      if (user) {
        const u = user as {
          id?: string;
          role?: UserRole;
          professionalId?: string | null;
          companyId?: string | null;
        };
        token.id = u.id ?? "";
        token.role = u.role ?? "empresa";
        token.professionalId = u.professionalId ?? null;
        token.companyId = u.companyId ?? null;
      }
      return token;
    },
  },
});
