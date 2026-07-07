import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Contraseña y email correctos, pero la cuenta todavía no confirmó su email. */
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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
  ],
});
